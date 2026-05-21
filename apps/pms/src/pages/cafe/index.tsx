import { Card, Col, Modal, Row, Spin, Statistic, Table, Tag } from 'antd'
import { NextPage } from 'next'
import React, { useState } from 'react'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import { Page, PageContent, PageHeader } from '../../components/ui'
import { useCafeAnalytics } from '../../hooks/cafe/useCafeAnalytics'
import { usePropertyId } from '../../hooks/cafe/usePropertyId'
import { formatPaise } from '../../lib/cafe/order-calculator'

const CafeDashboard: NextPage = () => {
  const { propertyId, isLoading: isLoadingProperty } = usePropertyId()
  const { analytics, isLoading } = useCafeAnalytics(propertyId)
  // Food-credits breakdown modal (staff vs customer + net revenue).
  const [creditsOpen, setCreditsOpen] = useState(false)

  const columns = [
    { title: 'Item', dataIndex: 'name', key: 'name' },
    { title: 'Qty Sold', dataIndex: 'count', key: 'count', align: 'right' as const },
  ]

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Cafe Zomad" icon="Food" />
        <PageContent>
          {isLoading || isLoadingProperty ? (
            <div className="flex justify-center py-20"><Spin size="large" /></div>
          ) : analytics ? (
            <>
              <Row gutter={[16, 16]} className="mb-8">
                <Col xs={12} md={8} lg={4}>
                  <Card><Statistic title="Orders Today" value={analytics.total_orders} /></Card>
                </Col>
                <Col xs={12} md={8} lg={5}>
                  <Card><Statistic title="Revenue (cash)" value={formatPaise(analytics.total_revenue)} /></Card>
                </Col>
                <Col xs={12} md={8} lg={5}>
                  <Card
                    hoverable
                    onClick={() => setCreditsOpen(true)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Statistic
                      title="Food Credits Used"
                      value={formatPaise(analytics.food_credits_used)}
                    />
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                      Tap for staff / customer split
                    </div>
                  </Card>
                </Col>
                <Col xs={12} md={8} lg={5}>
                  <Card><Statistic title="Avg Cash Order" value={formatPaise(analytics.avg_order_value)} /></Card>
                </Col>
                <Col xs={12} md={8} lg={5}>
                  <Card>
                    <Statistic
                      title="Active Orders"
                      value={analytics.active_orders}
                      suffix={analytics.active_orders > 0 ? <Tag color="red">live</Tag> : null}
                    />
                  </Card>
                </Col>
              </Row>
              {analytics.popular_items.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold mb-3 text-zui-silver">Popular Items Today</h3>
                  <Table
                    dataSource={analytics.popular_items}
                    columns={columns}
                    rowKey="name"
                    pagination={false}
                    size="small"
                  />
                </>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-zui-silver">No data available</div>
          )}
        </PageContent>
      </Page>

      {/* Food-credits breakdown — staff meals (a cost) vs customer credits
          (revenue), and the resulting net revenue. */}
      <Modal
        open={creditsOpen}
        onCancel={() => setCreditsOpen(false)}
        footer={null}
        title="Food Credits — breakdown"
        width={420}
      >
        {analytics && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
            <BreakdownRow
              label="Staff credits"
              hint="team meals — not revenue"
              value={formatPaise(analytics.staff_food_credits)}
            />
            <BreakdownRow
              label="Customer credits"
              hint="counts as revenue"
              value={formatPaise(analytics.customer_food_credits)}
            />
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', margin: '4px 0' }} />
            <BreakdownRow
              label="Total food credits used"
              value={formatPaise(analytics.food_credits_used)}
            />
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', margin: '4px 0' }} />
            <BreakdownRow
              label="Net Revenue"
              hint="cash collected + customer credits"
              value={formatPaise(analytics.total_revenue + analytics.customer_food_credits)}
              emphasis
            />
          </div>
        )}
      </Modal>
    </ZoHouseGuard>
  )
}

function BreakdownRow({
  label,
  hint,
  value,
  emphasis,
}: {
  label: string
  hint?: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontSize: emphasis ? 14 : 13, fontWeight: emphasis ? 700 : 500 }}>
          {label}
        </div>
        {hint && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{hint}</div>
        )}
      </div>
      <div style={{ fontSize: emphasis ? 18 : 14, fontWeight: emphasis ? 700 : 600, whiteSpace: 'nowrap' }}>
        {value}
      </div>
    </div>
  )
}

export default CafeDashboard
