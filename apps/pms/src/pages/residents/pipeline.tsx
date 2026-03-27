import React, { useState } from 'react'
import { Spin, Modal, Form, Input, Select, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import { Page, PageContent, PageHeader } from '../../components/ui'
import { useAssociation } from '../../hooks'
import { useResidentLeads } from '../../hooks/residents'
import ResidentLeadCard from '../../components/residents/ResidentLeadCard'
import ResidentLeadDrawer from '../../components/residents/ResidentLeadDrawer'
import type { ResidentLead, LeadSource, LeadPriority } from '../../types/residents'
import {
  RESIDENT_STAGES,
  RESIDENT_STAGE_LABELS,
  RESIDENT_STAGE_COLORS,
  SOURCE_LABELS,
} from '../../types/residents'

function operatorToProperty(code: string | undefined): string | null {
  if (code === 'BNGHO812') return 'BLRxZo'
  if (code === 'BNGS531') return 'WTFxZo'
  return null
}

function PipelineBoard() {
  const { selectedOperator } = useAssociation()
  const property = operatorToProperty(selectedOperator?.code)

  const {
    leadsByStage,
    isLoading,
    createLead,
    updateStage,
    updateLead,
    addNote,
    getActivity,
    getNotes,
  } = useResidentLeads({ property })

  const [selectedLead, setSelectedLead] = useState<ResidentLead | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [form] = Form.useForm()

  const handleCardClick = (lead: ResidentLead) => {
    setSelectedLead(lead)
    setDrawerOpen(true)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setSelectedLead(null)
  }

  const handleAddLead = async () => {
    try {
      const values = await form.validateFields()
      setAddLoading(true)
      const created = await createLead({
        ...values,
        property,
        stage: 'inquiry',
      })
      if (created) {
        message.success('Lead created')
        form.resetFields()
        setAddModalOpen(false)
      } else {
        message.error('Failed to create lead')
      }
    } catch {
      // validation error
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <Page>
      <PageHeader
        title="Pipeline"
        icon="Slip"
        buttons={[
          {
            label: 'Add Lead',
            onClick: () => setAddModalOpen(true),
            type: 'primary',
            icon: 'Plus',
          },
        ]}
      />
      <PageContent>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              paddingBottom: 16,
            }}
          >
            {RESIDENT_STAGES.map((stage) => {
              const stageLeads = leadsByStage[stage] || []
              const color = RESIDENT_STAGE_COLORS[stage]
              return (
                <div
                  key={stage}
                  style={{
                    minWidth: 260,
                    maxWidth: 280,
                    flex: '0 0 260px',
                    background: '#111',
                    borderRadius: 10,
                    padding: 12,
                    minHeight: 200,
                  }}
                >
                  {/* Column header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 12,
                      paddingBottom: 8,
                      borderBottom: '1px solid #222',
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: '#ccc', fontWeight: 600, fontSize: 13, flex: 1 }}>
                      {RESIDENT_STAGE_LABELS[stage]}
                    </span>
                    <span
                      style={{
                        color: '#666',
                        fontSize: 12,
                        background: '#1a1a1a',
                        borderRadius: 10,
                        padding: '1px 8px',
                      }}
                    >
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Cards */}
                  {stageLeads.length > 0 ? (
                    stageLeads.map((lead) => (
                      <ResidentLeadCard
                        key={lead.id}
                        lead={lead}
                        onClick={handleCardClick}
                      />
                    ))
                  ) : (
                    <div
                      style={{
                        color: '#444',
                        fontSize: 12,
                        textAlign: 'center',
                        padding: '24px 0',
                      }}
                    >
                      No leads
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Lead detail drawer */}
        <ResidentLeadDrawer
          lead={selectedLead}
          open={drawerOpen}
          onClose={handleDrawerClose}
          onStageChange={updateStage}
          onAddNote={addNote}
          onUpdateLead={updateLead}
          getActivity={getActivity}
          getNotes={getNotes}
        />

        {/* Add Lead modal */}
        <Modal
          title="Add Lead"
          open={addModalOpen}
          onCancel={() => {
            setAddModalOpen(false)
            form.resetFields()
          }}
          onOk={handleAddLead}
          confirmLoading={addLoading}
          okText="Create"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="full_name"
              label="Full Name"
              rules={[{ required: true, message: 'Name is required' }]}
            >
              <Input placeholder="John Doe" />
            </Form.Item>
            <Form.Item name="phone" label="Phone">
              <Input placeholder="+91 98765 43210" />
            </Form.Item>
            <Form.Item name="email" label="Email">
              <Input placeholder="john@example.com" />
            </Form.Item>
            <Form.Item name="source" label="Source">
              <Select
                placeholder="Select source"
                allowClear
                options={Object.entries(SOURCE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </Form.Item>
            <Form.Item name="priority" label="Priority" initialValue="normal">
              <Select
                options={[
                  { value: 'hot', label: 'Hot' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'cold', label: 'Cold' },
                ]}
              />
            </Form.Item>
            <Form.Item name="what_building" label="What are you building?">
              <Input.TextArea rows={3} placeholder="Describe your project..." />
            </Form.Item>
          </Form>
        </Modal>
      </PageContent>
    </Page>
  )
}

export default function ResidentPipeline() {
  return (
    <ZoHouseGuard>
      <PipelineBoard />
    </ZoHouseGuard>
  )
}
