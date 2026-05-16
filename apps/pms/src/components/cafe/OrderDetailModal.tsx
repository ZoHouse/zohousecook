import React from 'react'
import {
  Modal,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Divider,
} from 'antd'
import { STATUS_LABELS, STATUS_TAG_COLORS, getNextStatus } from '../../lib/cafe/kitchen-status'
import { formatPaise } from '../../lib/cafe/order-calculator'
import type { CafeOrderWithItems, KitchenStatus, OrderItem } from '../../types/cafe'

const { Text, Title } = Typography

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatMode(mode: string): string {
  return mode.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

interface OrderDetailModalProps {
  order: CafeOrderWithItems | null
  onClose: () => void
  onStatusChange?: (orderId: string, newStatus: KitchenStatus) => void
}

export function OrderDetailModal({ order, onClose, onStatusChange }: OrderDetailModalProps) {
  if (!order) return null

  const status = (order.kitchen_status ?? 'new') as KitchenStatus
  const nextStatus = getNextStatus(status)
  const activeItems = order.order_items?.filter((i) => i.item_status === 'active') || []
  const cancelledItems = order.order_items?.filter((i) => i.item_status === 'cancelled') || []

  const itemColumns = [
    {
      title: 'Item',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: OrderItem) => (
        <span>
          <Text strong>{record.quantity}x</Text> {name}
        </span>
      ),
    },
    {
      title: 'Unit Price',
      key: 'unit_price',
      render: (_: unknown, record: OrderItem) => formatPaise(record.price),
      align: 'right' as const,
    },
    {
      title: 'Total',
      key: 'total',
      render: (_: unknown, record: OrderItem) => formatPaise(record.price * record.quantity),
      align: 'right' as const,
    },
  ]

  return (
    <Modal
      title={
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            Order #{order.display_number}
          </Title>
          <Tag color={STATUS_TAG_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
        </Space>
      }
      open={!!order}
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnClose
    >
      {/* Meta info */}
      <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Mode">{formatMode(order.mode)}</Descriptions.Item>
        {order.table && (
          <Descriptions.Item label="Table">
            {order.table.area && `${order.table.area} — `}
            {order.table.label || order.table.code}
          </Descriptions.Item>
        )}
        {(order.customer_name || order.customer_phone) && (
          <Descriptions.Item label="Customer">{order.customer_name || order.customer_phone}</Descriptions.Item>
        )}
        {order.customer_phone && (
          <Descriptions.Item label="Phone">{order.customer_phone}</Descriptions.Item>
        )}
        <Descriptions.Item label="Placed at">{formatTimestamp(order.created_at)}</Descriptions.Item>
      </Descriptions>

      {/* Notes */}
      {order.notes && (
        <>
          <Text type="secondary" style={{ fontSize: 12 }}>Notes</Text>
          <div
            style={{
              background: 'rgba(0,0,0,0.03)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 6,
              padding: '8px 12px',
              marginTop: 4,
              marginBottom: 12,
              fontSize: 14,
            }}
          >
            {order.notes}
          </div>
        </>
      )}

      {/* Items table */}
      <Table
        dataSource={activeItems}
        columns={itemColumns}
        rowKey="id"
        size="small"
        pagination={false}
        style={{ marginBottom: 8 }}
      />

      {/* Cancelled items */}
      {cancelledItems.length > 0 && (
        <>
          <Text type="secondary" style={{ fontSize: 12 }}>Cancelled Items</Text>
          <Table
            dataSource={cancelledItems}
            columns={itemColumns}
            rowKey="id"
            size="small"
            pagination={false}
            rowClassName={() => 'cancelled-item-row'}
            style={{ marginBottom: 8, opacity: 0.5, textDecoration: 'line-through' }}
          />
        </>
      )}

      <Divider style={{ margin: '12px 0' }} />

      {/*
        Totals — multi-economy display. Cafe Zomad is a dual-payment system
        ($food credits + Razorpay/cash), so the breakdown has two stages:
          1. The order's gross value:    Subtotal + Tax = Order Total
          2. How it was paid:            Order Total − $food applied = Cash/Razorpay Due
        We show all four lines whenever credits were applied; otherwise we
        collapse to the single Order Total (no double-line confusion).
        Bottom label adapts to payment_status: To Pay / Paid / Refunded so
        the staff knows whether the Razorpay/cash leg is settled.
      */}
      {(() => {
        const orderGross = order.subtotal + order.service_charge + order.tax_amount
        const credit = order.food_credit_applied_paise || 0
        const dueAfterCredit = order.total
        const hasCredit = credit > 0
        const finalLabel =
          order.payment_status === 'paid'
            ? 'Paid (Razorpay / Cash)'
            : order.payment_status === 'refunded'
              ? 'Refunded'
              : 'To Pay (Razorpay / Cash)'
        const finalColor =
          order.payment_status === 'paid'
            ? '#52c41a'
            : order.payment_status === 'refunded'
              ? '#ff7875'
              : undefined
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">Subtotal</Text>
              <Text type="secondary">{formatPaise(order.subtotal)}</Text>
            </div>
            {order.service_charge > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Service Charge</Text>
                <Text type="secondary">{formatPaise(order.service_charge)}</Text>
              </div>
            )}
            {order.tax_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Tax (5%)</Text>
                <Text type="secondary">{formatPaise(order.tax_amount)}</Text>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 4,
                paddingTop: 4,
                borderTop: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <Text strong style={{ fontSize: 15 }}>Order Total</Text>
              <Text strong style={{ fontSize: 15 }}>{formatPaise(orderGross)}</Text>
            </div>
            {hasCredit && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">$food applied</Text>
                  <Text type="secondary">−{formatPaise(credit)}</Text>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 4,
                    paddingTop: 4,
                    borderTop: '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  <Text strong style={{ fontSize: 15, color: finalColor }}>{finalLabel}</Text>
                  <Text strong style={{ fontSize: 15, color: finalColor }}>{formatPaise(dueAfterCredit)}</Text>
                </div>
              </>
            )}
            {!hasCredit && order.payment_status !== 'pending' && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 4,
                }}
              >
                <Text strong style={{ fontSize: 13, color: finalColor }}>{finalLabel}</Text>
                <Text strong style={{ fontSize: 13, color: finalColor }}>{formatPaise(dueAfterCredit)}</Text>
              </div>
            )}
          </div>
        )
      })()}

      {/* Payment info */}
      <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Payment Status">
          <span style={{ textTransform: 'capitalize' }}>{order.payment_status}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Payment Mode">
          <span style={{ textTransform: 'capitalize' }}>{order.payment_mode}</span>
        </Descriptions.Item>
        {order.payment_id && (
          <Descriptions.Item label="Payment ID" span={2}>
            <Text code style={{ fontSize: 11 }}>{order.payment_id}</Text>
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Action buttons */}
      {status !== 'served' && status !== 'cancelled' && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            {nextStatus && onStatusChange && (
              <Button
                type="primary"
                onClick={() => {
                  onStatusChange(order.id, nextStatus)
                  onClose()
                }}
              >
                {nextStatus === 'accepted' && 'Accept'}
                {nextStatus === 'preparing' && 'Start Preparing'}
                {nextStatus === 'ready' && 'Mark Ready'}
                {nextStatus === 'served' && 'Mark Served'}
              </Button>
            )}
            {onStatusChange && (
              <Button
                danger
                onClick={() => {
                  onStatusChange(order.id, 'cancelled')
                  onClose()
                }}
              >
                Cancel Order
              </Button>
            )}
          </Space>
        </>
      )}
    </Modal>
  )
}
