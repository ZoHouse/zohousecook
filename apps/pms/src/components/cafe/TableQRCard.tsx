import React from 'react'
import { Card, Switch, Button, Space, Typography } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import type { CafeTable } from '../../types/cafe'

const { Text } = Typography

interface TableQRCardProps {
  table: CafeTable
  onToggleActive: (id: string, isActive: boolean) => void
  onEdit?: (table: CafeTable) => void
}

const TableQRCard: React.FC<TableQRCardProps> = ({ table, onToggleActive }) => {
  const orderUrl = `https://zozozo.work/cafezomad/${table.id}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(orderUrl)}`

  const handleDownloadQR = () => {
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `table-${table.code}.png`
    link.click()
  }

  return (
    <Card
      size="small"
      style={{
        opacity: table.is_active ? 1 : 0.5,
        transition: 'opacity 0.2s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      styles={{ body: { padding: 16, display: 'flex', flexDirection: 'column', height: '100%' } }}
    >
      {/* Label + code */}
      <div style={{ marginBottom: 4 }}>
        <Text strong style={{ fontSize: 14, display: 'block' }}>
          {table.label || table.code}
        </Text>
        <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
          {table.code} &middot; {table.capacity} seats
        </Text>
      </div>

      {/* Area */}
      <Text type="secondary" style={{ fontSize: 11, marginBottom: 12, display: 'block' }}>
        {table.area}
      </Text>

      {/* QR code — fixed size container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrUrl}
          alt={`QR code for ${table.label || table.code}`}
          width={140}
          height={140}
          style={{ borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', display: 'block' }}
        />
      </div>

      {/* Actions row — pinned to bottom */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Button
          size="small"
          icon={<DownloadOutlined />}
          onClick={handleDownloadQR}
        >
          QR
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          <Switch
            size="small"
            checked={table.is_active}
            onChange={(checked) => onToggleActive(table.id, checked)}
          />
        </div>
      </div>
    </Card>
  )
}

export default TableQRCard
