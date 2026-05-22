import { Card, Spin, Statistic, Table, Tag } from 'antd'
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
  // Whether the Food Credits card is expanded to show the staff/customer split.
  const [creditsExpanded, setCreditsExpanded] = useState(false)

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
              {/* Stat cards — equal-width CSS grid so they stay aligned at
                  every screen size and at equal height per row. */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <Card style={{ height: '100%' }}>
                  <Statistic title="Orders Today" value={analytics.total_orders} />
                </Card>

                <Card style={{ height: '100%' }}>
                  <Statistic
                    title="Revenue (cash)"
                    value={formatPaise(analytics.total_revenue)}
                  />
                </Card>

                {/* Net Revenue = cash collected + customer credits. Staff
                    credits are left out — staff meals are a team perk. */}
                <Card style={{ height: '100%' }}>
                  <Statistic
                    title="Net Revenue"
                    value={formatPaise(
                      analytics.total_revenue + analytics.customer_food_credits,
                    )}
                  />
                  <div className="mt-1 text-[11px] text-white/40">
                    cash + customer credits
                  </div>
                </Card>

                {/* Food Credits — tap anywhere on the card (or the arrow) to
                    expand the staff vs customer split inline. */}
                <Card
                  hoverable
                  onClick={() => setCreditsExpanded((v) => !v)}
                  style={{ height: '100%', cursor: 'pointer' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Statistic
                      title="Food Credits Used"
                      value={formatPaise(analytics.food_credits_used)}
                    />
                    <Chevron open={creditsExpanded} />
                  </div>
                  {creditsExpanded && (
                    <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
                      <SplitRow
                        label="Staff"
                        hint="team meals"
                        value={formatPaise(analytics.staff_food_credits)}
                      />
                      <SplitRow
                        label="Other users"
                        hint="customers"
                        value={formatPaise(analytics.customer_food_credits)}
                      />
                    </div>
                  )}
                </Card>

                <Card style={{ height: '100%' }}>
                  <Statistic
                    title="Active Orders"
                    value={analytics.active_orders}
                    suffix={analytics.active_orders > 0 ? <Tag color="red">live</Tag> : null}
                  />
                </Card>
              </div>

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

/** Rotating chevron — the expand/collapse affordance on the Food Credits card. */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        flexShrink: 0,
        opacity: 0.65,
        transition: 'transform 0.2s ease',
        transform: open ? 'rotate(180deg)' : 'none',
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/** One line of the Food Credits breakdown: label + hint on the left, amount right. */
function SplitRow({ label, hint, value }: { label: string; hint: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-white/55">
        {label} <span className="text-white/30">· {hint}</span>
      </span>
      <span className="text-sm font-semibold whitespace-nowrap">{value}</span>
    </div>
  )
}

export default CafeDashboard
