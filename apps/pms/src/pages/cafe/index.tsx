import { Card, Col, Row, Spin, Statistic, Table, Tag } from 'antd'
import { NextPage } from 'next'
import React from 'react'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import { Page, PageContent, PageHeader } from '../../components/ui'
import { useCafeAnalytics } from '../../hooks/cafe/useCafeAnalytics'
import { usePropertyId } from '../../hooks/cafe/usePropertyId'
import { formatPaise } from '../../lib/cafe/order-calculator'

const CafeDashboard: NextPage = () => {
  const { propertyId, isLoading: isLoadingProperty } = usePropertyId()
  const { analytics, isLoading } = useCafeAnalytics(propertyId)

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
                  <Card><Statistic title="Food Credits Used" value={formatPaise(analytics.food_credits_used)} /></Card>
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
    </ZoHouseGuard>
  )
}

export default CafeDashboard
