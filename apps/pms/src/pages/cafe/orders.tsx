import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NextPage } from "next";
import { Drawer, Empty, Segmented, Spin, Table, Tabs, Tag } from "antd";
import type { TableColumnsType } from "antd";
import ZoHouseGuard from "../../components/helpers/app/ZoHouseGuard";
import { Page, PageContent, PageHeader } from "../../components/ui";
import { usePropertyId } from "../../hooks/cafe/usePropertyId";
import { supabase } from "../../configs/supabase";
import {
  STATUS_LABELS,
  STATUS_TAG_COLORS,
} from "../../lib/cafe/kitchen-status";
import { formatPaise } from "../../lib/cafe/order-calculator";
import type { KitchenStatus } from "../../types/cafe";

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "New", value: "new" },
  { label: "Accepted", value: "accepted" },
  { label: "Preparing", value: "preparing" },
  { label: "Ready", value: "ready" },
  { label: "Served", value: "served" },
  { label: "Cancelled", value: "cancelled" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Order = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OrderItem = Record<string, any>;

interface GuestSummary {
  name: string;
  phone: string;
  orderCount: number;
  totalSpend: number;
  lastOrderAt: string;
}

// ─── Order Detail Drawer ──────────────────────────────────────────────────────

function OrderDrawer({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!order) return;
    setLoading(true);
    supabase
      .from("cafe_order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, [order]);

  if (!order) return null;

  const s = order.kitchen_status as KitchenStatus;

  return (
    <Drawer
      title={`Order #${order.display_number}`}
      open={!!order}
      onClose={onClose}
      width={420}
    >
      {/* Order meta */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "rgba(255,255,255,0.45)" }}>Status</span>
          {s ? (
            <Tag color={STATUS_TAG_COLORS[s] || "default"}>{STATUS_LABELS[s] || s}</Tag>
          ) : (
            <Tag>Pending</Tag>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "rgba(255,255,255,0.45)" }}>Guest</span>
          <span style={{ fontWeight: 500 }}>
            {order.customer_name || "—"}
            {order.customer_phone ? ` (${order.customer_phone})` : ""}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "rgba(255,255,255,0.45)" }}>Table</span>
          <span style={{ fontWeight: 500 }}>{order.table_label || order.table_id?.substring(0, 8) || "—"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "rgba(255,255,255,0.45)" }}>Time</span>
          <span style={{ fontWeight: 500 }}>
            {new Date(order.created_at).toLocaleString("en-IN", {
              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true,
            })}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "rgba(255,255,255,0.45)" }}>Payment</span>
          <span style={{ fontWeight: 500, textTransform: "capitalize" }}>
            {(order.payment_mode || "").replace("_", " ")} / {order.payment_status || "pending"}
          </span>
        </div>
      </div>

      {/* Items */}
      <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "rgba(255,255,255,0.45)" }}>
        Items
      </h4>
      {loading ? (
        <Spin size="small" />
      ) : items.length === 0 ? (
        <Empty description="No items" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {item.name}
                  {item.item_status === "cancelled" && (
                    <Tag color="error" style={{ marginLeft: 8, fontSize: 10 }}>Cancelled</Tag>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                  {formatPaise(item.price)} x {item.quantity}
                </div>
              </div>
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                {formatPaise(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Total */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        <span>Total</span>
        <span>{formatPaise(order.total || 0)}</span>
      </div>
    </Drawer>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

function OrdersTab({ propertyId }: { propertyId: string }) {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let q = supabase
      .from("cafe_orders")
      .select("*, table:cafe_tables(code, label)", { count: "exact" })
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (statusFilter) {
      q = q.eq("kitchen_status", statusFilter);
    }

    const { data, count } = await q;
    setOrders(data || []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [propertyId, statusFilter, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const columns: TableColumnsType<Order> = [
    {
      title: "#",
      key: "num",
      width: 60,
      render: (_: unknown, r: Order) => (
        <span style={{ fontFamily: "monospace", fontWeight: 600 }}>#{r.display_number}</span>
      ),
    },
    {
      title: "Time",
      key: "time",
      width: 120,
      render: (_: unknown, r: Order) => {
        try {
          return (
            <span style={{ fontSize: 12 }}>
              {new Date(r.created_at).toLocaleString("en-IN", {
                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
              })}
            </span>
          );
        } catch {
          return "—";
        }
      },
    },
    {
      title: "Guest",
      key: "guest",
      width: 120,
      render: (_: unknown, r: Order) => (
        <span style={{ textTransform: "capitalize" }}>{r.customer_name || "—"}</span>
      ),
    },
    {
      title: "Table",
      key: "table",
      width: 100,
      render: (_: unknown, r: Order) => (
        <span style={{ fontSize: 12 }}>
          {r.table?.label || r.table?.code || "—"}
        </span>
      ),
    },
    {
      title: "Total",
      key: "total",
      width: 80,
      render: (_: unknown, r: Order) => (
        <span style={{ fontWeight: 600 }}>{formatPaise(r.total || 0)}</span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      render: (_: unknown, r: Order) => {
        const s = r.kitchen_status as KitchenStatus;
        if (!s) return <Tag>Pending</Tag>;
        return <Tag color={STATUS_TAG_COLORS[s] || "default"}>{STATUS_LABELS[s] || s}</Tag>;
      },
    },
    {
      title: "Payment",
      key: "payment",
      width: 110,
      render: (_: unknown, r: Order) => (
        <span style={{ fontSize: 12, opacity: 0.6, textTransform: "capitalize" }}>
          {(r.payment_mode || "").replace("_", " ")} / {r.payment_status || "pending"}
        </span>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, overflowX: "auto" }}>
        <Segmented
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v as string); setPage(1); }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spin size="large" /></div>
      ) : orders.length === 0 ? (
        <Empty description="No orders found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Table
          dataSource={orders}
          columns={columns}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            onChange: (p: number) => setPage(p),
            showSizeChanger: false,
          }}
          scroll={{ x: 680 }}
          size="small"
          onRow={(record) => ({
            onClick: () => setSelectedOrder(record),
            style: { cursor: "pointer" },
          })}
        />
      )}

      <OrderDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </>
  );
}

// ─── Guests Tab ───────────────────────────────────────────────────────────────

function GuestsTab({ propertyId }: { propertyId: string }) {
  const [guests, setGuests] = useState<GuestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null);
  const [guestOrders, setGuestOrders] = useState<Order[]>([]);
  const [guestOrdersLoading, setGuestOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function fetchGuests() {
      setLoading(true);
      const { data } = await supabase
        .from("cafe_orders")
        .select("customer_name, customer_phone, total, created_at")
        .eq("property_id", propertyId)
        .not("customer_name", "is", null)
        .order("created_at", { ascending: false });

      if (!data) { setGuests([]); setLoading(false); return; }

      // Aggregate by phone (primary) or name (fallback)
      const map = new Map<string, GuestSummary>();
      for (const o of data) {
        const key = o.customer_phone || o.customer_name || "unknown";
        if (!map.has(key)) {
          map.set(key, {
            name: o.customer_name || "—",
            phone: o.customer_phone || "—",
            orderCount: 0,
            totalSpend: 0,
            lastOrderAt: o.created_at,
          });
        }
        const g = map.get(key)!;
        g.orderCount++;
        g.totalSpend += o.total || 0;
        if (o.created_at > g.lastOrderAt) g.lastOrderAt = o.created_at;
      }

      setGuests(
        Array.from(map.values()).sort((a, b) => b.lastOrderAt.localeCompare(a.lastOrderAt))
      );
      setLoading(false);
    }
    fetchGuests();
  }, [propertyId]);

  // Fetch orders for selected guest
  useEffect(() => {
    if (!selectedGuest) { setGuestOrders([]); return; }
    setGuestOrdersLoading(true);
    const guest = guests.find((g) => (g.phone !== "—" ? g.phone : g.name) === selectedGuest);
    if (!guest) { setGuestOrdersLoading(false); return; }

    let q = supabase
      .from("cafe_orders")
      .select("*, table:cafe_tables(code, label)")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (guest.phone !== "—") {
      q = q.eq("customer_phone", guest.phone);
    } else {
      q = q.eq("customer_name", guest.name);
    }

    q.then(({ data }) => {
      setGuestOrders(data || []);
      setGuestOrdersLoading(false);
    });
  }, [selectedGuest, propertyId, guests]);

  const guestColumns: TableColumnsType<GuestSummary> = [
    {
      title: "Guest",
      key: "name",
      render: (_: unknown, r: GuestSummary) => (
        <span style={{ fontWeight: 500, textTransform: "capitalize" }}>{r.name}</span>
      ),
    },
    {
      title: "Phone",
      key: "phone",
      width: 140,
      render: (_: unknown, r: GuestSummary) => (
        <span style={{ fontSize: 12 }}>{r.phone}</span>
      ),
    },
    {
      title: "Orders",
      key: "count",
      width: 80,
      align: "right" as const,
      render: (_: unknown, r: GuestSummary) => r.orderCount,
    },
    {
      title: "Total Spend",
      key: "spend",
      width: 110,
      align: "right" as const,
      render: (_: unknown, r: GuestSummary) => (
        <span style={{ fontWeight: 600 }}>{formatPaise(r.totalSpend)}</span>
      ),
    },
    {
      title: "Last Order",
      key: "last",
      width: 110,
      render: (_: unknown, r: GuestSummary) => (
        <span style={{ fontSize: 12 }}>
          {new Date(r.lastOrderAt).toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "2-digit",
          })}
        </span>
      ),
    },
  ];

  const guestOrderColumns: TableColumnsType<Order> = [
    {
      title: "#",
      key: "num",
      width: 60,
      render: (_: unknown, r: Order) => (
        <span style={{ fontFamily: "monospace", fontWeight: 600 }}>#{r.display_number}</span>
      ),
    },
    {
      title: "Date",
      key: "date",
      width: 130,
      render: (_: unknown, r: Order) => (
        <span style={{ fontSize: 12 }}>
          {new Date(r.created_at).toLocaleString("en-IN", {
            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
          })}
        </span>
      ),
    },
    {
      title: "Table",
      key: "table",
      width: 100,
      render: (_: unknown, r: Order) => r.table?.label || r.table?.code || "—",
    },
    {
      title: "Total",
      key: "total",
      width: 80,
      align: "right" as const,
      render: (_: unknown, r: Order) => (
        <span style={{ fontWeight: 600 }}>{formatPaise(r.total || 0)}</span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      render: (_: unknown, r: Order) => {
        const s = r.kitchen_status as KitchenStatus;
        if (!s) return <Tag>Pending</Tag>;
        return <Tag color={STATUS_TAG_COLORS[s] || "default"}>{STATUS_LABELS[s] || s}</Tag>;
      },
    },
  ];

  if (selectedGuest) {
    const guest = guests.find((g) => (g.phone !== "—" ? g.phone : g.name) === selectedGuest);
    return (
      <>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setSelectedGuest(null)}
            style={{ background: "none", border: "none", color: "#cfff50", cursor: "pointer", fontSize: 13 }}
          >
            &larr; All Guests
          </button>
          <span style={{ fontWeight: 600, textTransform: "capitalize" }}>
            {guest?.name || "Guest"} — {guest?.phone || ""}
          </span>
          <Tag>{guest?.orderCount} orders</Tag>
          <span style={{ fontWeight: 600 }}>{formatPaise(guest?.totalSpend || 0)}</span>
        </div>

        {guestOrdersLoading ? (
          <div className="flex justify-center py-16"><Spin size="large" /></div>
        ) : (
          <Table
            dataSource={guestOrders}
            columns={guestOrderColumns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 20, showSizeChanger: false }}
            scroll={{ x: 500 }}
            onRow={(record) => ({
              onClick: () => setSelectedOrder(record),
              style: { cursor: "pointer" },
            })}
          />
        )}
        <OrderDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      </>
    );
  }

  return (
    <>
      {loading ? (
        <div className="flex justify-center py-16"><Spin size="large" /></div>
      ) : guests.length === 0 ? (
        <Empty description="No guest data — orders need customer name/phone" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Table
          dataSource={guests}
          columns={guestColumns}
          rowKey={(r) => r.phone !== "—" ? r.phone : r.name}
          size="small"
          pagination={{ pageSize: 20, showSizeChanger: false }}
          scroll={{ x: 560 }}
          onRow={(record) => ({
            onClick: () => setSelectedGuest(record.phone !== "—" ? record.phone : record.name),
            style: { cursor: "pointer" },
          })}
        />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const CafeOrdersPage: NextPage = () => {
  const { propertyId, isLoading: propLoading } = usePropertyId();

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Orders" icon="Slip" />
        <PageContent>
          {propLoading || !propertyId ? (
            <div className="flex justify-center py-16"><Spin size="large" /></div>
          ) : (
            <Tabs
              defaultActiveKey="orders"
              items={[
                {
                  key: "orders",
                  label: "Orders",
                  children: <OrdersTab propertyId={propertyId} />,
                },
                {
                  key: "guests",
                  label: "Guests",
                  children: <GuestsTab propertyId={propertyId} />,
                },
              ]}
            />
          )}
        </PageContent>
      </Page>
    </ZoHouseGuard>
  );
};

export default CafeOrdersPage;
