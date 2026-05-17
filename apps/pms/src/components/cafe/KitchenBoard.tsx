import React, { useState } from 'react'
import { Badge, Button, Card, Modal, Space, Tag, Typography } from 'antd'
import { useCafeRealtimeOrders } from '../../hooks/cafe/useCafeRealtimeOrders'
import { useInventoryStatus } from '../../hooks/cafe/useInventoryStatus'
import { computeOrderInventoryStatus } from '../../lib/cafe/inventory-check'
import {
  ADVANCE_ACTION_LABELS,
  STATUS_LABELS,
  STATUS_TAG_COLORS,
} from '../../lib/cafe/kitchen-status'
import type {
  CafeOrderWithItems,
  InventoryItemState,
  KitchenStatus,
  OrderInventoryStatus,
} from '../../types/cafe'
import moment from 'moment'

const { Text, Title } = Typography

const BOARD_COLUMNS: {
  key: string
  label: string
  statuses: KitchenStatus[]
  badgeColor: string
}[] = [
  {
    key: 'new',
    label: 'New / Accepted',
    statuses: ['new', 'accepted'],
    badgeColor: '#faad14',
  },
  {
    key: 'preparing',
    label: 'Preparing',
    statuses: ['preparing'],
    badgeColor: '#fa8c16',
  },
  {
    key: 'ready',
    label: 'Ready',
    statuses: ['ready'],
    badgeColor: '#52c41a',
  },
]

interface KitchenBoardProps {
  propertyId: string
  onViewDetail?: (order: CafeOrderWithItems) => void
}

export function KitchenBoard({ propertyId, onViewDetail }: KitchenBoardProps) {
  const { orders, isLoading, advanceStatus, acceptWithOverride, cancelOrder } =
    useCafeRealtimeOrders(propertyId)
  const invCtx = useInventoryStatus(propertyId)
  const [mobileTab, setMobileTab] = useState('new')

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 300,
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        Loading kitchen board...
      </div>
    )
  }

  const getColumnOrders = (statuses: KitchenStatus[]) =>
    orders.filter((o) => statuses.includes(o.kitchen_status as KitchenStatus))

  return (
    <>
      {/* ── Mobile: tab switcher + single column ─────────────────────────── */}
      <div className="kitchen-mobile" style={{ display: 'none' }}>
        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 12,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            paddingBottom: 8,
            paddingTop: 4,
          }}
        >
          {BOARD_COLUMNS.map((col) => {
            const count = getColumnOrders(col.statuses).length
            const isActive = mobileTab === col.key
            return (
              <button
                key={col.key}
                onClick={() => setMobileTab(col.key)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRadius: 8,
                  border: isActive ? `2px solid ${col.badgeColor}` : '2px solid rgba(255,255,255,0.1)',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                {col.label.split(' / ')[0]}
                <Badge
                  count={count}
                  style={{ backgroundColor: col.badgeColor, fontWeight: 600 }}
                  showZero
                />
              </button>
            )
          })}
        </div>

        {/* Active column orders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(() => {
            const activeCol = BOARD_COLUMNS.find((c) => c.key === mobileTab) || BOARD_COLUMNS[0]
            const colOrders = getColumnOrders(activeCol.statuses)
            if (colOrders.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  No orders
                </div>
              )
            }
            return colOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAdvance={advanceStatus}
                onOverride={acceptWithOverride}
                onCancel={cancelOrder}
                onViewDetail={onViewDetail}
                invCtx={invCtx}
              />
            ))
          })()}
        </div>
      </div>

      {/* ── Desktop: 3-column kanban ─────────────────────────────────────── */}
      <div
        className="kitchen-desktop"
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        {BOARD_COLUMNS.map((col) => {
          const colOrders = getColumnOrders(col.statuses)

          return (
            <div
              key={col.key}
              style={{
                flex: '1 1 300px',
                minWidth: 280,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {/* Column header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  marginBottom: 4,
                }}
              >
                <Text strong style={{ fontSize: 14 }}>
                  {col.label}
                </Text>
                <Badge
                  count={colOrders.length}
                  style={{
                    backgroundColor: col.badgeColor,
                    fontWeight: 600,
                  }}
                  showZero
                />
              </div>

              {/* Order cards */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  maxHeight: 'calc(100vh - 220px)',
                  overflowY: 'auto',
                  paddingRight: 2,
                }}
              >
                {colOrders.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '32px 0',
                      color: 'rgba(255,255,255,0.3)',
                      fontSize: 13,
                    }}
                  >
                    No orders
                  </div>
                ) : (
                  colOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onAdvance={advanceStatus}
                      onOverride={acceptWithOverride}
                      onCancel={cancelOrder}
                      onViewDetail={onViewDetail}
                      invCtx={invCtx}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .kitchen-mobile { display: block !important; }
          .kitchen-desktop { display: none !important; }
        }
        @media (min-width: 769px) {
          .kitchen-mobile { display: none !important; }
          .kitchen-desktop { display: flex !important; }
        }
      `}</style>
    </>
  )
}

interface OrderCardProps {
  order: CafeOrderWithItems
  onAdvance: (orderId: string, currentStatus: KitchenStatus) => Promise<void>
  onOverride: (orderId: string) => Promise<void>
  onCancel: (orderId: string) => Promise<void>
  onViewDetail?: (order: CafeOrderWithItems) => void
  invCtx: ReturnType<typeof useInventoryStatus>
}

function OrderCard({
  order,
  onAdvance,
  onOverride,
  onCancel,
  onViewDetail,
  invCtx,
}: OrderCardProps) {
  const status = order.kitchen_status as KitchenStatus
  const advanceLabel = ADVANCE_ACTION_LABELS[status]
  const customerLabel = order.customer_name || order.customer_phone || null
  // Table label: prefer the cafe_tables.label (e.g. "Garden 4") over the
  // bare code, and fall back to the order mode capitalised when there's no
  // table (pickup / room_service). "Table " prefix only when we have a table.
  const tableLabel = order.table
    ? `Table ${order.table.label || order.table.code}`
    : order.mode.replace('_', ' ')
  const activeItems = order.order_items.filter((i) => i.item_status === 'active')

  const inventoryStatus: OrderInventoryStatus = React.useMemo(
    () => computeOrderInventoryStatus(order, invCtx),
    [order, invCtx],
  )

  const itemStateByOrderItemId = React.useMemo(() => {
    const m = new Map<string, InventoryItemState>()
    for (const s of inventoryStatus.items) m.set(s.orderItemId, s.state)
    return m
  }, [inventoryStatus])

  // Override mode applies only when the chef is at the new→accepted step
  // AND the card state is red (out of stock for at least one ingredient).
  const showOverride = status === 'new' && inventoryStatus.cardState === 'red'

  return (
    <Card
      size="small"
      styles={{
        body: { padding: '10px 12px' },
      }}
      style={{
        borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        cursor: onViewDetail ? 'pointer' : 'default',
      }}
      onClick={onViewDetail ? () => onViewDetail(order) : undefined}
    >
      {/* Header row: order number + time + status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <Title level={4} style={{ margin: 0, fontSize: 20, lineHeight: 1 }}>
          #{order.display_number}
        </Title>
        <Space size={4}>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            {moment(order.created_at).format('HH:mm')}
          </Text>
          <Tag color={STATUS_TAG_COLORS[status]} style={{ margin: 0 }}>
            {STATUS_LABELS[status]}
          </Tag>
        </Space>
      </div>

      {/* Customer name + table — chefs need this to know WHO and WHERE the
          food is going, especially during dine-in service. */}
      <div style={{ marginBottom: 6 }}>
        {customerLabel && (
          <Text
            strong
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.95)',
              display: 'block',
              lineHeight: 1.3,
            }}
          >
            {customerLabel}
          </Text>
        )}
        <Text
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.55)',
            display: 'block',
            textTransform: 'capitalize',
          }}
        >
          {tableLabel}
        </Text>
      </div>

      {/* Items list with per-item inventory dots */}
      <div style={{ marginBottom: 8 }}>
        {activeItems.map((item) => {
          const state = itemStateByOrderItemId.get(item.id) || 'grey'
          return (
            <div
              key={item.id}
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.75)',
                lineHeight: '1.6',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              title={INDICATOR_TOOLTIP[state]}
            >
              <InventoryDot state={state} />
              <span>
                {item.name} &times; {item.quantity}
              </span>
            </div>
          )
        })}
      </div>

      {/* Summary line — only render if we have something useful to say */}
      {inventoryStatus.summary && (
        <div
          style={{
            fontSize: 11,
            padding: '5px 8px',
            borderRadius: 5,
            marginBottom: 8,
            ...SUMMARY_STYLE[inventoryStatus.cardState],
          }}
        >
          {SUMMARY_PREFIX[inventoryStatus.cardState]} {inventoryStatus.summary}
        </div>
      )}

      {/* Action buttons */}
      <div
        style={{ display: 'flex', gap: 6, alignItems: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        {advanceLabel && showOverride ? (
          <>
            <Button
              size="small"
              disabled
              style={{ flex: 1 }}
              title="Out of stock for at least one ingredient — use Override & Accept"
            >
              Accept
            </Button>
            <Button
              size="small"
              style={{
                flex: 1,
                background: 'rgba(250,173,20,0.20)',
                color: '#f5c451',
                border: '1px solid rgba(250,173,20,0.6)',
              }}
              onClick={(e) => {
                e.stopPropagation()
                Modal.confirm({
                  title: 'Override & Accept this order?',
                  content: inventoryStatus.summary
                    ? `${inventoryStatus.summary}. Accepting will deduct what's available and clamp the rest to 0.`
                    : "Accepting will deduct what's available and clamp the rest to 0.",
                  okText: 'Yes, Override',
                  cancelText: 'Cancel',
                  onOk: () => onOverride(order.id),
                })
              }}
            >
              Override &amp; Accept
            </Button>
          </>
        ) : (
          advanceLabel && (
            <Button
              type="primary"
              size="small"
              style={{ flex: 1 }}
              onClick={(e) => {
                e.stopPropagation()
                onAdvance(order.id, status)
              }}
            >
              {advanceLabel}
            </Button>
          )
        )}
        <Button
          danger
          size="small"
          type="text"
          onClick={(e) => { e.stopPropagation(); onCancel(order.id) }}
          style={{ fontSize: 11 }}
        >
          Cancel
        </Button>
      </div>
    </Card>
  )
}

// -- Indicator styling primitives (used by OrderCard above) --------------

const DOT_COLOR: Record<InventoryItemState, string> = {
  green:  '#52c41a',
  yellow: '#faad14',
  red:    '#ff4d4f',
  grey:   '#8c8c8c',
}

const SUMMARY_STYLE: Record<InventoryItemState, React.CSSProperties> = {
  green:  { background: 'rgba(82,196,26,0.10)',  color: '#95df72', border: '1px solid rgba(82,196,26,0.25)' },
  yellow: { background: 'rgba(250,173,20,0.12)', color: '#f5c451', border: '1px solid rgba(250,173,20,0.35)' },
  red:    { background: 'rgba(255,77,79,0.12)',  color: '#ff8585', border: '1px solid rgba(255,77,79,0.35)' },
  grey:   { background: 'rgba(140,140,140,0.10)', color: '#bfbfbf', border: '1px solid rgba(140,140,140,0.25)' },
}

const SUMMARY_PREFIX: Record<InventoryItemState, string> = {
  green:  '✓',
  yellow: '⚠',
  red:    '✕',
  grey:   '⦿',
}

const INDICATOR_TOOLTIP: Record<InventoryItemState, string> = {
  green:  'All ingredients in stock',
  yellow: 'Stock is running low for this item',
  red:    'Out of stock for at least one ingredient',
  grey:   "Can't check stock for this item (no recipe or unit mismatch)",
}

function InventoryDot({ state }: { state: InventoryItemState }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: DOT_COLOR[state],
        flexShrink: 0,
      }}
    />
  )
}
