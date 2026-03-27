import React from 'react'
import { Tag } from 'antd'
import { WhatsAppOutlined } from '@ant-design/icons'
import type { ResidentLead } from '../../types/residents'
import { SOURCE_LABELS, RESIDENT_STAGE_COLORS } from '../../types/residents'

interface ResidentLeadCardProps {
  lead: ResidentLead
  onClick: (lead: ResidentLead) => void
}

function daysInStage(stageChangedAt: string): number {
  const changed = new Date(stageChangedAt)
  const now = new Date()
  return Math.floor((now.getTime() - changed.getTime()) / (1000 * 60 * 60 * 24))
}

const ResidentLeadCard: React.FC<ResidentLeadCardProps> = ({ lead, onClick }) => {
  const initial = lead.full_name?.charAt(0)?.toUpperCase() || '?'
  const days = daysInStage(lead.stage_changed_at)
  const propertyColor = lead.property === 'BLRxZo' ? '#3b82f6' : lead.property === 'WTFxZo' ? '#10b981' : undefined

  return (
    <div
      onClick={() => onClick(lead)}
      style={{
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#cfff50'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#333'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Top row: avatar + name + priority */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#222',
            color: '#cfff50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <span style={{ fontWeight: 600, color: '#fff', fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lead.full_name}
        </span>
        {lead.priority === 'hot' && <Tag color="red" style={{ margin: 0 }}>HOT</Tag>}
      </div>

      {/* Tags row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
        {lead.source && (
          <Tag style={{ fontSize: 11, margin: 0 }}>{SOURCE_LABELS[lead.source] || lead.source}</Tag>
        )}
        {lead.property && (
          <Tag color={propertyColor} style={{ fontSize: 11, margin: 0 }}>{lead.property}</Tag>
        )}
        {lead.events_attended > 0 && (
          <Tag style={{ fontSize: 11, margin: 0 }}>{lead.events_attended} events</Tag>
        )}
      </div>

      {/* Footer: days in stage + WhatsApp */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: days > 7 ? '#f59e0b' : '#666' }}>
          {days}d in stage
        </span>
        {lead.phone && (
          <a
            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ color: '#25D366', fontSize: 16 }}
          >
            <WhatsAppOutlined />
          </a>
        )}
      </div>
    </div>
  )
}

export default ResidentLeadCard
