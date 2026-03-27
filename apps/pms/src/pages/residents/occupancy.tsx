import { Card, Col, Row, Spin, Statistic } from 'antd'
import { NextPage } from 'next'
import React, { useMemo } from 'react'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import OccupancyGrid from '../../components/residents/OccupancyGrid'
import { Page, PageContent, PageHeader } from '../../components/ui'
import { useAssociation } from '../../hooks'
import { useOccupancy } from '../../hooks/residents'

function operatorToProperty(code: string | undefined): string | null {
  if (code === 'BNGHO812') return 'BLRxZo'
  if (code === 'BNGS531') return 'WTFxZo'
  return null
}

const OccupancyPage: NextPage = () => {
  const { selectedOperator } = useAssociation()
  const property = operatorToProperty(selectedOperator?.code)

  const { entries, isLoading } = useOccupancy({
    operatorCode: selectedOperator?.code ?? null,
  })

  // Total beds by property
  const totalBeds = property === 'BLRxZo' ? 15 : property === 'WTFxZo' ? 20 : 35

  // Generate 35-day array (today + 34 future days)
  const days = useMemo(() => {
    const arr: Date[] = []
    const now = new Date()
    for (let i = 0; i < 35; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
      arr.push(d)
    }
    return arr
  }, [])

  // Count occupied beds today
  const todayStr = useMemo(() => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  }, [])

  const occupiedToday = useMemo(() => {
    return entries.filter((e) => {
      const arrival = (e.arrivaldate || '').split('T')[0]
      const departure = (e.departuredate || '').split('T')[0]
      return arrival <= todayStr && todayStr < departure
    }).length
  }, [entries, todayStr])

  const occupancyPct = totalBeds > 0 ? Math.round((occupiedToday / totalBeds) * 100) : 0
  const availableBeds = totalBeds - occupiedToday

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Occupancy" icon="Calendar" />
        <PageContent>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spin size="large" />
            </div>
          ) : (
            <>
              <Row gutter={[16, 16]} className="mb-8">
                <Col xs={24} md={8}>
                  <Card>
                    <Statistic
                      title="Occupied Today"
                      value={occupiedToday}
                      suffix={`/ ${totalBeds}`}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card>
                    <Statistic title="Occupancy" value={occupancyPct} suffix="%" />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card>
                    <Statistic title="Available Beds" value={availableBeds} />
                  </Card>
                </Col>
              </Row>

              <h3 className="text-sm font-semibold mb-3 text-zui-silver">
                Bed Calendar — 35 Day View
              </h3>
              <OccupancyGrid entries={entries} days={days} operatorCode={selectedOperator?.code ?? null} />
            </>
          )}
        </PageContent>
      </Page>
    </ZoHouseGuard>
  )
}

export default OccupancyPage
