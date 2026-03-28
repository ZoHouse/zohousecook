import React, { useEffect, useState } from 'react'
import {
  Drawer,
  Select,
  Descriptions,
  Tag,
  Input,
  Button,
  Timeline,
  Divider,
  message,
} from 'antd'
import { WhatsAppOutlined, LinkOutlined } from '@ant-design/icons'
import type {
  ResidentLead,
  ResidentStage,
  ResidentLeadNote,
  ResidentLeadActivity,
} from '../../types/residents'
import {
  ALL_RESIDENT_STAGES,
  RESIDENT_STAGE_LABELS,
  RESIDENT_STAGE_COLORS,
  SOURCE_LABELS,
} from '../../types/residents'

const { TextArea } = Input

interface ResidentLeadDrawerProps {
  lead: ResidentLead | null
  open: boolean
  onClose: () => void
  onStageChange: (leadId: string, stage: ResidentStage) => Promise<void>
  onAddNote: (leadId: string, content: string, author?: string) => Promise<void>
  onUpdateLead: (leadId: string, updates: Partial<ResidentLead>) => Promise<void>
  getActivity: (leadId: string) => Promise<ResidentLeadActivity[]>
  getNotes: (leadId: string) => Promise<ResidentLeadNote[]>
}

const ResidentLeadDrawer: React.FC<ResidentLeadDrawerProps> = ({
  lead,
  open,
  onClose,
  onStageChange,
  onAddNote,
  onUpdateLead,
  getActivity,
  getNotes,
}) => {
  const [noteText, setNoteText] = useState('')
  const [activities, setActivities] = useState<ResidentLeadActivity[]>([])
  const [notes, setNotes] = useState<ResidentLeadNote[]>([])
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [submittingNote, setSubmittingNote] = useState(false)

  useEffect(() => {
    if (open && lead) {
      setNoteText('')
      setLoadingTimeline(true)
      Promise.all([getActivity(lead.id), getNotes(lead.id)])
        .then(([actData, noteData]) => {
          setActivities(actData)
          setNotes(noteData)
        })
        .finally(() => setLoadingTimeline(false))
    }
  }, [open, lead?.id])

  if (!lead) return null

  const handleStageChange = async (newStage: ResidentStage) => {
    await onStageChange(lead.id, newStage)
    message.success(`Stage updated to ${RESIDENT_STAGE_LABELS[newStage]}`)
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    setSubmittingNote(true)
    try {
      await onAddNote(lead.id, noteText.trim(), 'Boldrin')
      setNoteText('')
      // Refresh timeline
      const [actData, noteData] = await Promise.all([
        getActivity(lead.id),
        getNotes(lead.id),
      ])
      setActivities(actData)
      setNotes(noteData)
      message.success('Note added')
    } finally {
      setSubmittingNote(false)
    }
  }

  const handleToggleDead = async () => {
    await onUpdateLead(lead.id, { is_dead: !lead.is_dead })
    message.success(lead.is_dead ? 'Lead reactivated' : 'Lead marked as dead')
  }

  // Merge notes + activities into single timeline
  const timelineItems = [
    ...notes.map((n) => ({
      type: 'note' as const,
      date: n.created_at,
      content: n.content,
      author: n.author,
    })),
    ...activities.map((a) => ({
      type: 'activity' as const,
      date: a.created_at,
      content:
        a.action === 'stage_changed'
          ? `Stage: ${a.from_stage} → ${a.to_stage}`
          : a.action === 'lead_created'
          ? 'Lead created'
          : a.action === 'note_added'
          ? (a.detail || 'Note added')
          : a.action,
      author: null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <Drawer
      title={lead.full_name}
      placement="right"
      width={480}
      open={open}
      onClose={onClose}
      extra={
        <Select
          value={lead.stage}
          onChange={handleStageChange}
          style={{ width: 160 }}
          options={ALL_RESIDENT_STAGES.map((s) => ({
            value: s,
            label: RESIDENT_STAGE_LABELS[s],
          }))}
        />
      }
    >
      {/* Contact */}
      <Descriptions column={1} size="small" labelStyle={{ color: '#999' }}>
        {lead.phone && (
          <Descriptions.Item label="Phone">
            <a
              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#25D366' }}
            >
              <WhatsAppOutlined /> {lead.phone}
            </a>
          </Descriptions.Item>
        )}
        {lead.email && (
          <Descriptions.Item label="Email">{lead.email}</Descriptions.Item>
        )}
        {lead.twitter && (
          <Descriptions.Item label="Twitter">
            <a
              href={`https://x.com/${lead.twitter.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              @{lead.twitter.replace('@', '')}
            </a>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Property">
          <Select
            value={lead.property || undefined}
            onChange={(v) => {
              onUpdateLead(lead.id, { property: v || null })
              message.success(`Tagged as ${v}`)
            }}
            placeholder="Assign property"
            allowClear
            style={{ width: 140 }}
            size="small"
            options={[
              { value: 'BLRxZo', label: 'BLRxZo' },
              { value: 'WTFxZo', label: 'WTFxZo' },
            ]}
          />
        </Descriptions.Item>
        {lead.preferred_duration && (
          <Descriptions.Item label="Duration">{lead.preferred_duration}</Descriptions.Item>
        )}
        {lead.quoted_price_monthly != null && (
          <Descriptions.Item label="Price/mo">
            {'\u20B9'}{lead.quoted_price_monthly.toLocaleString('en-IN')}
          </Descriptions.Item>
        )}
        {lead.source && (
          <Descriptions.Item label="Source">
            <Tag>{SOURCE_LABELS[lead.source] || lead.source}</Tag>
          </Descriptions.Item>
        )}
      </Descriptions>

      {/* Application Q&A */}
      {lead.what_building && (
        <>
          <Divider style={{ borderColor: '#333' }}>Application</Divider>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ color: '#999', fontSize: 12, marginBottom: 2 }}>What are you building?</div>
              <div style={{ color: '#fff' }}>{lead.what_building}</div>
            </div>
            {lead.last_30_days && (
              <div>
                <div style={{ color: '#999', fontSize: 12, marginBottom: 2 }}>Last 30 days</div>
                <div style={{ color: '#fff' }}>{lead.last_30_days}</div>
              </div>
            )}
            {lead.what_you_bring && (
              <div>
                <div style={{ color: '#999', fontSize: 12, marginBottom: 2 }}>What do you bring?</div>
                <div style={{ color: '#fff' }}>{lead.what_you_bring}</div>
              </div>
            )}
            {lead.portfolio_link && (
              <div>
                <div style={{ color: '#999', fontSize: 12, marginBottom: 2 }}>Portfolio</div>
                <a href={lead.portfolio_link} target="_blank" rel="noopener noreferrer">
                  <LinkOutlined /> {lead.portfolio_link}
                </a>
              </div>
            )}
          </div>
        </>
      )}

      {/* Enrichment */}
      <Divider style={{ borderColor: '#333' }}>Enrichment</Divider>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Tag>{lead.events_attended} events attended</Tag>
        {lead.vibe_score != null && <Tag color="purple">Vibe: {lead.vibe_score}</Tag>}
        <Tag>{lead.total_nights_stayed} nights stayed</Tag>
      </div>

      {/* Add Note */}
      <Divider style={{ borderColor: '#333' }}>Notes</Divider>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <TextArea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a note..."
          autoSize={{ minRows: 2, maxRows: 4 }}
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          onClick={handleAddNote}
          loading={submittingNote}
          disabled={!noteText.trim()}
          style={{ alignSelf: 'flex-end' }}
        >
          Add
        </Button>
      </div>

      {/* Activity Timeline */}
      {loadingTimeline ? (
        <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>Loading timeline...</div>
      ) : timelineItems.length > 0 ? (
        <Timeline
          items={timelineItems.map((item) => ({
            color: item.type === 'note' ? 'blue' : 'green',
            children: (
              <div>
                <div style={{ color: '#fff', fontSize: 13 }}>{item.content}</div>
                <div style={{ color: '#666', fontSize: 11 }}>
                  {item.author && <span>{item.author} &middot; </span>}
                  {new Date(item.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ),
          }))}
        />
      ) : (
        <div style={{ textAlign: 'center', color: '#666', padding: 12 }}>No activity yet</div>
      )}

      {/* Mark Dead */}
      <Divider style={{ borderColor: '#333' }} />
      <Button danger block onClick={handleToggleDead}>
        {lead.is_dead ? 'Reactivate Lead' : 'Mark as Dead'}
      </Button>
    </Drawer>
  )
}

export default ResidentLeadDrawer
