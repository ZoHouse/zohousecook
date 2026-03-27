import { Button, message, Popconfirm, Spin, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { NextPage } from 'next'
import React, { useState } from 'react'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import ResidentLeadDrawer from '../../components/residents/ResidentLeadDrawer'
import { Page, PageContent, PageHeader } from '../../components/ui'
import { useAssociation } from '../../hooks'
import { useResidentLeads } from '../../hooks/residents'
import type { ResidentLead } from '../../types/residents'
import { SOURCE_LABELS } from '../../types/residents'

function operatorToProperty(code: string | undefined): string | null {
  if (code === 'BNGHO812') return 'BLRxZo'
  if (code === 'BNGS531') return 'WTFxZo'
  return null
}

const ApplicationsPage: NextPage = () => {
  const { selectedOperator } = useAssociation()
  const property = operatorToProperty(selectedOperator?.code)

  const {
    leads,
    isLoading,
    updateStage,
    updateLead,
    addNote,
    getActivity,
    getNotes,
  } = useResidentLeads({ property, stageFilter: 'inquiry' })

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<ResidentLead | null>(null)

  const openDrawer = (lead: ResidentLead) => {
    setSelectedLead(lead)
    setDrawerOpen(true)
  }

  const handleApprove = async (lead: ResidentLead) => {
    await updateStage(lead.id, 'approved')
    message.success(`${lead.full_name} approved`)
  }

  const handleCall = async (lead: ResidentLead) => {
    await updateStage(lead.id, 'call_scheduled')
    message.success(`Call scheduled for ${lead.full_name}`)
  }

  const handleReject = async (lead: ResidentLead) => {
    await updateLead(lead.id, { is_dead: true })
    message.info(`${lead.full_name} rejected`)
  }

  const columns: ColumnsType<ResidentLead> = [
    {
      title: 'Name',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (name: string, record: ResidentLead) => (
        <a
          onClick={() => openDrawer(record)}
          style={{ color: '#cfff50', cursor: 'pointer' }}
        >
          {name}
        </a>
      ),
    },
    {
      title: 'Building',
      dataIndex: 'what_building',
      key: 'what_building',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Property Pref',
      dataIndex: 'preferred_property',
      key: 'preferred_property',
      width: 100,
      ellipsis: true,
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (source: string | null) =>
        source ? <Tag>{SOURCE_LABELS[source as keyof typeof SOURCE_LABELS] || source}</Tag> : '—',
    },
    {
      title: 'Events',
      dataIndex: 'events_attended',
      key: 'events_attended',
      align: 'center' as const,
    },
    {
      title: 'Portfolio',
      dataIndex: 'portfolio_link',
      key: 'portfolio_link',
      render: (link: string | null) =>
        link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#cfff50' }}
          >
            Link
          </a>
        ) : (
          '—'
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: ResidentLead) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="primary" size="small" onClick={() => handleApprove(record)}>
            Approve
          </Button>
          <Button size="small" onClick={() => handleCall(record)}>
            Call
          </Button>
          <Popconfirm
            title="Reject this application?"
            onConfirm={() => handleReject(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger size="small">
              Reject
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Applications" icon="Doc" />
        <PageContent>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spin size="large" />
            </div>
          ) : (
            <Table
              dataSource={leads}
              columns={columns}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 20 }}
            />
          )}
        </PageContent>
      </Page>

      <ResidentLeadDrawer
        lead={selectedLead}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStageChange={updateStage}
        onAddNote={addNote}
        onUpdateLead={updateLead}
        getActivity={getActivity}
        getNotes={getNotes}
      />
    </ZoHouseGuard>
  )
}

export default ApplicationsPage
