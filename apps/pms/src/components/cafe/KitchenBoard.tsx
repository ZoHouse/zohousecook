import React from 'react'
import { Badge, Button, Card, Space, Tag, Typography } from 'antd'
import { useCafeRealtimeOrders } from '../../hooks/cafe/useCafeRealtimeOrders'
import {
  ADVANCE_ACTION_LABELS,
  KANBAN_COLUMNS,
  STATUS_LABELS,
  STATUS_TAG_COLORS,
} from '../../lib/cafe/kitchen-status'
import type { CafeOrderWithItems, KitchenStatus } from '../../types/cafe'
import moment from 'moment'

const { Text, Title } = Typography

// Columns shown on the board — 3 visible: New+Accepted merged, Preparing, Ready
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
}

export function KitchenBoard({ propertyId }: KitchenBoardProps) {
  const { orders, isLoading, advanceStatus, cancelOrder } =
    useCafeRealtimeOrders(propertyId)

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

  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        overflowX: 'auto',
        paddingBottom: 8,
      }}
    >
      {BOARD_COLUMNS.map((col) => {
        const colOrders = orders.filter((o) =>
          col.statuses.includes(o.kitchen_status as KitchenStatus)
        )

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
                    onCancel={cancelOrder}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface OrderCardProps {
  order: CafeOrderWithItems
  onAdvance: (orderId: string, currentStatus: KitchenStatus) => Promise<void>
  onCancel: (orderId: string) => Promise<void>
}

function OrderCard({ order, onAdvance, onCancel }: OrderCardProps) {
  const status = order.kitchen_status as KitchenStatus
  const advanceLabel = ADVANCE_ACTION_LABELS[status]
  const tableLabel = order.table?.code || order.mode.replace('_', ' ')
  const activeItems = order.order_items.filter((i) => i.item_status === 'active')

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
      }}
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

      {/* Table / mode */}
      <Text
        style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.55)',
          display: 'block',
          marginBottom: 6,
          textTransform: 'capitalize',
        }}
      >
        {tableLabel}
      </Text>

      {/* Items list */}
      <div style={{ marginBottom: 8 }}>
        {activeItems.map((item) => (
          <div
            key={item.id}
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.75)',
              lineHeight: '1.6',
            }}
          >
            {item.name} &times; {item.quantity}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <Space size={6} style={{ width: '100%' }}>
        {advanceLabel && (
          <Button
            type="primary"
            size="small"
            style={{ flex: 1 }}
            onClick={() => onAdvance(order.id, status)}
          >
            {advanceLabel}
          </Button>
        )}
        <Button
          danger
          size="small"
          type="text"
          onClick={() => onCancel(order.id)}
          style={{ fontSize: 11 }}
        >
          Cancel
        </Button>
      </Space>
    </Card>
  )
}
