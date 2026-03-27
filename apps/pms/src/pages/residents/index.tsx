import { Card, Col, Row, Spin, Statistic, Tag } from 'antd'
import { NextPage } from 'next'
import React from 'react'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import { Page, PageContent, PageHeader } from '../../components/ui'
import { useAssociation } from '../../hooks'
import { useResidentStats } from '../../hooks/residents'
import {
  RESIDENT_STAGES,
  RESIDENT_STAGE_COLORS,
  RESIDENT_STAGE_LABELS,
  ResidentStage,
} from '../../types/residents'

function operatorToProperty(code: string | undefined): string | null {
  if (code === 'BNGHO812') return 'BLRxZo'
  if (code === 'BNGS531') return 'WTFxZo'
  return null
}

const ResidentsDashboard: NextPage = () => {
  const { selectedOperator } = useAssociation()
  const property = operatorToProperty(selectedOperator?.code)
  const { totalLeads, byStage, bedsFilled, callsDueToday, conversionRate, isLoading } =
    useResidentStats({ property })

  const totalBeds = property === 'BLRxZo' ? 15 : property === 'WTFxZo' ? 20 : 35
  const filledBeds = property === 'BLRxZo'
    ? bedsFilled.blr
    : property === 'WTFxZo'
      ? bedsFilled.wtf
      : bedsFilled.blr + bedsFilled.wtf

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Residents" icon="People" />
        <PageContent>
          {isLoading ? (
            <div className="flex justify-center py-20"><Spin size="large" /></div>
          ) : (
            <>
              {/* Stat cards */}
              <Row gutter={[16, 16]} className="mb-8">
                <Col xs={12} md={6}>
                  <Card>
                    <Statistic title="Beds Filled" value={filledBeds} suffix={`/ ${totalBeds}`} />
                    {!property && (
                      <div className="text-xs text-zui-silver mt-1">
                        BLR {bedsFilled.blr}/15 &middot; WTF {bedsFilled.wtf}/20
                      </div>
                    )}
                  </Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card>
                    <Statistic title="Pipeline" value={totalLeads} suffix="leads" />
                  </Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card>
                    <Statistic title="Calls Due" value={callsDueToday} suffix="today" />
                  </Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card>
                    <Statistic title="Conversion" value={conversionRate} suffix="%" />
                  </Card>
                </Col>
              </Row>

              {/* Pipeline by stage */}
              <h3 className="text-sm font-semibold mb-3 text-zui-silver">Pipeline by Stage</h3>
              <div className="flex flex-wrap gap-2">
                {RESIDENT_STAGES.map((stage: ResidentStage) => (
                  <Tag key={stage} color={RESIDENT_STAGE_COLORS[stage]}>
                    {RESIDENT_STAGE_LABELS[stage]}: {byStage[stage] || 0}
                  </Tag>
                ))}
              </div>
            </>
          )}
        </PageContent>
      </Page>
    </ZoHouseGuard>
  )
}

export default ResidentsDashboard
