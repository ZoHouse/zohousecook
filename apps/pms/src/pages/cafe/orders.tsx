import React, { useState } from "react";
import { NextPage } from "next";
import { Button, Empty, Segmented, Spin, Table, Tag } from "antd";
import type { TableColumnsType } from "antd";
import ZoHouseGuard from "../../components/helpers/app/ZoHouseGuard";
import { Page, PageContent, PageHeader } from "../../components/ui";
import { useCafeOrders } from "../../hooks/cafe/useCafeOrders";
import { usePropertyId } from "../../hooks/cafe/usePropertyId";
import {
  STATUS_LABELS,
  STATUS_TAG_COLORS,
} from "../../lib/cafe/kitchen-status";
import { formatPaise } from "../../lib/cafe/order-calculator";
import type { CafeOrderWithItems, KitchenStatus } from "../../types/cafe";

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

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "--:--";
  }
}

const CafeOrdersPage: NextPage = () => {
  const { propertyId, isLoading: isLoadingProperty } = usePropertyId();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const { orders, totalCount, isLoading } = useCafeOrders({
    propertyId,
    kitchenStatus: statusFilter || null,
    page,
    pageSize: PAGE_SIZE,
  });

  const columns: TableColumnsType<CafeOrderWithItems> = [
    {
      title: "#",
      key: "display_number",
      width: 60,
      render: (_: unknown, order: CafeOrderWithItems) => (
        <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
          #{order.display_number}
        </span>
      ),
    },
    {
      title: "Time",
      key: "time",
      width: 80,
      render: (_: unknown, order: CafeOrderWithItems) => (
        <span style={{ fontFamily: "monospace", fontSize: 12 }}>
          {formatTime(order.created_at)}
        </span>
      ),
    },
    {
      title: "Table",
      key: "table",
      width: 100,
      render: (_: unknown, order: CafeOrderWithItems) => (
        <span style={{ textTransform: "capitalize" }}>
          {order.table?.code || (order.mode || "").replace("_", " ")}
        </span>
      ),
    },
    {
      title: "Items",
      key: "items",
      width: 60,
      render: (_: unknown, order: CafeOrderWithItems) => {
        const count =
          order.order_items?.filter(
            (i) => i.item_status === "active"
          ).length ?? 0;
        return <span style={{ fontFamily: "monospace" }}>{count}</span>;
      },
    },
    {
      title: "Total",
      key: "total",
      width: 90,
      render: (_: unknown, order: CafeOrderWithItems) => (
        <span style={{ fontWeight: 600 }}>{formatPaise(order.total)}</span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 110,
      render: (_: unknown, order: CafeOrderWithItems) => {
        const status = order.kitchen_status as KitchenStatus;
        if (!status) return <Tag>Pending</Tag>;
        return (
          <Tag color={STATUS_TAG_COLORS[status] || "default"}>
            {STATUS_LABELS[status] || status}
          </Tag>
        );
      },
    },
    {
      title: "Payment",
      key: "payment",
      width: 120,
      render: (_: unknown, order: CafeOrderWithItems) => (
        <span
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.55)",
            textTransform: "capitalize",
          }}
        >
          {(order.payment_mode || "").replace("_", " ")} /{" "}
          {order.payment_status || "pending"}
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
              onChange={(val) => {
                setStatusFilter(val as string);
                setPage(1);
              }}
            />
          </div>

          {isLoading || isLoadingProperty ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: 60,
              }}
            >
              <Spin size="large" />
            </div>
          ) : orders.length === 0 ? (
            <Empty
              description="No orders found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table<CafeOrderWithItems>
              dataSource={orders}
              columns={columns}
              rowKey="id"
              pagination={{
                current: page,
                pageSize: PAGE_SIZE,
                total: totalCount,
                onChange: (p: number) => setPage(p),
                showSizeChanger: false,
              }}
              scroll={{ x: 600 }}
              size="small"
            />
          )}
        </PageContent>
      </Page>
    </ZoHouseGuard>
  );
};

export default CafeOrdersPage;
