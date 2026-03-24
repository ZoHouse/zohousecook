import React, { useCallback, useEffect, useState } from "react";
import { NextPage } from "next";
import { Empty, Segmented, Spin, Table, Tag } from "antd";
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

const CafeOrdersPage: NextPage = () => {
  const { propertyId, isLoading: propLoading } = usePropertyId();
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!propertyId) {
      setOrders([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let q = supabase
      .from("cafe_orders")
      .select("*", { count: "exact" })
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
        <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
          #{r.display_number}
        </span>
      ),
    },
    {
      title: "Time",
      key: "time",
      width: 80,
      render: (_: unknown, r: Order) => {
        try {
          return (
            <span style={{ fontFamily: "monospace", fontSize: 12 }}>
              {new Date(r.created_at).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          );
        } catch {
          return "--:--";
        }
      },
    },
    {
      title: "Mode",
      key: "mode",
      width: 100,
      render: (_: unknown, r: Order) => (
        <span style={{ textTransform: "capitalize" }}>
          {(r.mode || "").replace("_", " ")}
        </span>
      ),
    },
    {
      title: "Total",
      key: "total",
      width: 90,
      render: (_: unknown, r: Order) => (
        <span style={{ fontWeight: 600 }}>{formatPaise(r.total || 0)}</span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 110,
      render: (_: unknown, r: Order) => {
        const s = r.kitchen_status as KitchenStatus;
        if (!s) return <Tag>Pending</Tag>;
        return (
          <Tag color={STATUS_TAG_COLORS[s] || "default"}>
            {STATUS_LABELS[s] || s}
          </Tag>
        );
      },
    },
    {
      title: "Payment",
      key: "payment",
      width: 120,
      render: (_: unknown, r: Order) => (
        <span style={{ fontSize: 12, opacity: 0.6, textTransform: "capitalize" }}>
          {(r.payment_mode || "").replace("_", " ")} / {r.payment_status || "pending"}
        </span>
      ),
    },
  ];

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Orders" icon="Food" />
        <PageContent>
          <div style={{ marginBottom: 16 }}>
            <Segmented
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v as string);
                setPage(1);
              }}
            />
          </div>

          {loading || propLoading ? (
            <div className="flex justify-center py-16">
              <Spin size="large" />
            </div>
          ) : orders.length === 0 ? (
            <Empty
              description="No orders found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
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
              scroll={{ x: 560 }}
              size="small"
            />
          )}
        </PageContent>
      </Page>
    </ZoHouseGuard>
  );
};

export default CafeOrdersPage;
