import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { NextPage } from 'next'
import {
  Card,
  Col,
  DatePicker,
  Empty,
  Rate,
  Row,
  Segmented,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import { Page, PageContent, PageHeader } from '../../components/ui'
import { usePropertyId } from '../../hooks/cafe/usePropertyId'
import { supabase } from '../../configs/supabase'
import { formatPaise } from '../../lib/cafe/order-calculator'

const { Text, Title, Paragraph } = Typography

const RATING_FILTER_OPTIONS = [
  { label: 'All', value: 0 },
  { label: '★ 5', value: 5 },
  { label: '★ 4', value: 4 },
  { label: '★ 3', value: 3 },
  { label: '★ 2', value: 2 },
  { label: '★ 1', value: 1 },
] as const

const RATING_TAG_COLORS: Record<number, string> = {
  5: 'green',
  4: 'lime',
  3: 'gold',
  2: 'orange',
  1: 'red',
}

interface FeedbackRow {
  id: string
  order_id: string
  zo_user_id: string | null
  property_id: string
  rating: number
  comment: string | null
  created_at: string
  order: {
    display_number: number
    total: number
    customer_name: string | null
    customer_phone: string | null
    created_at: string
  } | null
}

const ReviewsPage: NextPage = () => {
  const { propertyId, isLoading: isLoadingProperty } = usePropertyId()

  const [rows, setRows] = useState<FeedbackRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [ratingFilter, setRatingFilter] = useState<number>(0)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(30, 'day').startOf('day'),
    dayjs().endOf('day'),
  ])

  const fetchFeedback = useCallback(async () => {
    if (!propertyId) {
      setRows([])
      return
    }
    setIsLoading(true)
    try {
      // Join cafe_orders so we can show display_number / total / guest name
      // without a second round trip per row. Supabase nests joined data under
      // the alias we pick — `order` here matches FeedbackRow shape.
      let query = supabase
        .from('cafe_order_feedback')
        .select(
          'id, order_id, zo_user_id, property_id, rating, comment, created_at, order:cafe_orders!inner(display_number, total, customer_name, customer_phone, created_at)',
        )
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .limit(500)

      if (ratingFilter > 0) query = query.eq('rating', ratingFilter)
      if (dateRange[0]) query = query.gte('created_at', dateRange[0].toISOString())
      if (dateRange[1]) query = query.lte('created_at', dateRange[1].toISOString())

      const { data, error } = await query
      if (error) throw error
      // Supabase types many-to-one joins as arrays in some versions even though
      // runtime returns a single object. Normalize.
      const normalized = (data || []).map((r) => {
        const raw = (r as { order?: unknown }).order
        const order = Array.isArray(raw) ? raw[0] : raw
        return { ...r, order: (order as FeedbackRow['order']) || null }
      }) as FeedbackRow[]
      setRows(normalized)
    } catch (err) {
      console.error('Failed to load cafe reviews', err)
    } finally {
      setIsLoading(false)
    }
  }, [propertyId, ratingFilter, dateRange])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  const stats = useMemo(() => {
    if (rows.length === 0) {
      return { count: 0, avg: 0, withComment: 0, distribution: [0, 0, 0, 0, 0] }
    }
    const distribution = [0, 0, 0, 0, 0]
    let total = 0
    let withComment = 0
    for (const r of rows) {
      total += r.rating
      distribution[r.rating - 1] += 1
      if (r.comment && r.comment.trim()) withComment += 1
    }
    return {
      count: rows.length,
      avg: total / rows.length,
      withComment,
      distribution,
    }
  }, [rows])

  const columns: TableColumnsType<FeedbackRow> = [
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      width: 140,
      render: (r: number) => (
        <Tag color={RATING_TAG_COLORS[r] || 'default'} style={{ fontWeight: 600 }}>
          {'★'.repeat(r)}
          <span style={{ opacity: 0.4 }}>{'★'.repeat(5 - r)}</span>
        </Tag>
      ),
      sorter: (a, b) => a.rating - b.rating,
    },
    {
      title: 'Order',
      key: 'order',
      width: 120,
      render: (_: unknown, row: FeedbackRow) =>
        row.order ? (
          <span style={{ fontFamily: 'monospace' }}>#{row.order.display_number}</span>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Guest',
      key: 'guest',
      render: (_: unknown, row: FeedbackRow) =>
        row.order?.customer_name || row.order?.customer_phone || (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Total',
      key: 'total',
      width: 100,
      render: (_: unknown, row: FeedbackRow) =>
        row.order ? formatPaise(row.order.total) : <Text type="secondary">—</Text>,
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
      render: (c: string | null) =>
        c ? (
          <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }} ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}>
            {c}
          </Paragraph>
        ) : (
          <Text type="secondary" italic>
            No comment
          </Text>
        ),
    },
    {
      title: 'Submitted',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (t: string) =>
        new Date(t).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      defaultSortOrder: 'descend',
    },
  ]

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Cafe Reviews" icon="Food" />
        <PageContent>
          {isLoadingProperty ? (
            <div className="flex justify-center py-20">
              <Spin size="large" />
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                  <Card>
                    <Statistic
                      title="Average rating"
                      value={stats.count === 0 ? '—' : stats.avg.toFixed(2)}
                      suffix={
                        stats.count > 0 ? (
                          <Rate
                            disabled
                            allowHalf
                            value={stats.avg}
                            style={{ fontSize: 14, marginLeft: 8 }}
                          />
                        ) : null
                      }
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card>
                    <Statistic title="Total reviews" value={stats.count} />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card>
                    <Statistic
                      title="With comment"
                      value={stats.withComment}
                      suffix={
                        stats.count > 0 ? (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            / {stats.count}
                          </Text>
                        ) : null
                      }
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Distribution
                      </Text>
                      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {[5, 4, 3, 2, 1].map((r) => {
                          const c = stats.distribution[r - 1]
                          const pct = stats.count > 0 ? (c / stats.count) * 100 : 0
                          return (
                            <div
                              key={r}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}
                            >
                              <span style={{ width: 18, fontWeight: 600 }}>{r}★</span>
                              <div
                                style={{
                                  flex: 1,
                                  height: 6,
                                  borderRadius: 3,
                                  background: 'rgba(255,255,255,0.08)',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${pct}%`,
                                    height: '100%',
                                    background: '#cfff50',
                                  }}
                                />
                              </div>
                              <span style={{ width: 24, textAlign: 'right', fontFamily: 'monospace' }}>
                                {c}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>

              {/* Filters */}
              <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: 16 }}>
                <Space size="middle" wrap>
                  <Space direction="vertical" size={4}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Rating
                    </Text>
                    <Segmented
                      options={RATING_FILTER_OPTIONS.map((o) => ({
                        label: o.label,
                        value: o.value,
                      }))}
                      value={ratingFilter}
                      onChange={(v) => setRatingFilter(v as number)}
                    />
                  </Space>
                  <Space direction="vertical" size={4}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Date range
                    </Text>
                    <DatePicker.RangePicker
                      value={dateRange}
                      onChange={(v) =>
                        setDateRange(v ? (v as [Dayjs | null, Dayjs | null]) : [null, null])
                      }
                      allowClear
                    />
                  </Space>
                </Space>
              </Card>

              {/* Table */}
              <Card bodyStyle={{ padding: 0 }}>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Spin />
                  </div>
                ) : rows.length === 0 ? (
                  <Empty
                    description="No reviews in this range"
                    style={{ padding: 60 }}
                  />
                ) : (
                  <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={rows}
                    pagination={{ pageSize: 25, showSizeChanger: false }}
                  />
                )}
              </Card>
            </>
          )}
        </PageContent>
      </Page>
    </ZoHouseGuard>
  )
}

export default ReviewsPage
