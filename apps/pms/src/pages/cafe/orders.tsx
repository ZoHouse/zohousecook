import React, { useState } from 'react'
import { NextPage } from 'next'
import { Segmented, Spin, Table, Tag } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import { Page, PageContent, PageHeader } from '../../components/ui'
import { useCafeOrders } from '../../hooks/cafe/useCafeOrders'
import { usePropertyId } from '../../hooks/cafe/usePropertyId'
import { STATUS_LABELS, STATUS_TAG_COLORS } from '../../lib/cafe/kitchen-status'
import { formatPaise } from '../../lib/cafe/order-calculator'
import type { CafeOrderWithItems, KitchenStatus } from '../../types/cafe'
import moment from 'moment'

const PAGE_SIZE = 25

const STATUS_FILTER_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'New', value: 'new' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Preparing', value: 'preparing' },
  { label: 'Ready', value: 'ready' },
  { label: 'Served', value: 'served' },
  { label: 'Cancelled', value: 'cancelled' },
]

const CafeOrdersPage: NextPage = () => {
  const { propertyId } = usePropertyId()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  const { orders, totalCount, isLoading } = useCafeOrders({
    propertyId,
    kitchenStatus: statusFilter || null,
    page,
    pageSize: PAGE_SIZE,
  })

  const columns: ColumnsType<CafeOrderWithItems> = [
    {
      title: '#',
      key: 'display_number',
      width: 60,
      render: (_, order) => (
        <span style={{ fontFamily: 'monospace' }}>#{order.display_number}</span>
      ),
    },
    {
      title: 'Time',
      key: 'time',
      width: 70,
      render: (_, order) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {moment(order.created_at).format('HH:mm')}
        </span>
      ),
    },
    {
      title: 'Table',
      key: 'table',
      width: 90,
      render: (_, order) => (
        <span style={{ textTransform: 'capitalize' }}>
          {order.table?.code || order.mode.replace('_', ' ')}
        </span>
      ),
    },
    {
      title: 'Items',
      key: 'items',
      width: 70,
      render: (_, order) => {
        const activeCount =
          order.order_items?.filter((i) => i.item_status === 'active').length ?? 0
        return (
          <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.55)' }}>
            {activeCount}
          </span>
        )
      },
    },
    {
      title: 'Total',
      key: 'total',
      width: 90,
      render: (_, order) => (
        <span style={{ fontWeight: 600 }}>{formatPaise(order.total)}</span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_, order) => {
        const status = order.kitchen_status as KitchenStatus
        if (!status) return null
        return (
          <Tag color={STATUS_TAG_COLORS[status]} style={{ margin: 0 }}>
            {STATUS_LABELS[status]}
          </Tag>
        )
      },
    },
    {
      title: 'Payment',
      key: 'payment',
      render: (_, order) => (
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', textTransform: 'capitalize' }}>
          {order.payment_mode.replace('_', ' ')}
          {' / '}
          {order.payment_status}
        </span>
      ),
    },
  ]

  const pagination: TablePaginationConfig = {
    current: page,
    pageSize: PAGE_SIZE,
    total: totalCount,
    showTotal: (total) => `${total} orders`,
    onChange: (p) => setPage(p),
    showSizeChanger: false,
  }

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Orders" icon="Food" />
        <PageContent>
          {/* Status filter */}
          <div style={{ marginBottom: 16 }}>
            <Segmented
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val as string)
                setPage(1)
              }}
            />
          </div>

          {/* Orders table */}
          {isLoading && orders.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table<CafeOrderWithItems>
              dataSource={orders}
              columns={columns}
              rowKey="id"
              pagination={pagination}
              loading={isLoading}
              scroll={{ x: 600 }}
              size="small"
            />
          )}
        </PageContent>
      </Page>
    </ZoHouseGuard>
  )
}

export default CafeOrdersPage
