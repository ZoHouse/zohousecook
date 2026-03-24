import React from 'react'
import { Card, Badge, Switch, Button, Space } from 'antd'
import { DownloadOutlined, EditOutlined } from '@ant-design/icons'
import type { CafeTable } from '../../types/cafe'

interface TableQRCardProps {
  table: CafeTable
  onToggleActive: (id: string, isActive: boolean) => void
  onEdit?: (table: CafeTable) => void
}

const TableQRCard: React.FC<TableQRCardProps> = ({ table, onToggleActive, onEdit }) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(table.qr_data)}`

  const handleDownloadQR = () => {
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `table-${table.code}.png`
    link.click()
  }

  return (
    <Card
      size="small"
      style={{ opacity: table.is_active ? 1 : 0.6, transition: 'opacity 0.2s' }}
      styles={{ body: { padding: 12 } }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Space size={8}>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15 }}>{table.code}</span>
          {table.label && (
            <span style={{ color: '#8c8c8c', fontSize: 12 }}>{table.label}</span>
          )}
        </Space>
        <Badge
          count={`${table.capacity} seats`}
          style={{ backgroundColor: '#595959', fontSize: 11 }}
        />
      </div>

      {/* Area */}
      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 10 }}>{table.area}</div>

      {/* QR code image */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrUrl}
          alt={`QR code for table ${table.code}`}
          width={120}
          height={120}
          style={{ borderRadius: 6, border: '1px solid #f0f0f0' }}
        />
      </div>

      {/* Actions row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Space size={6}>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={handleDownloadQR}
          >
            QR
          </Button>
          {onEdit && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(table)}
            >
              Edit
            </Button>
          )}
        </Space>

        <Space size={6}>
          <span style={{ fontSize: 12, color: table.is_active ? '#52c41a' : '#8c8c8c' }}>
            {table.is_active ? 'Active' : 'Inactive'}
          </span>
          <Switch
            size="small"
            checked={table.is_active}
            onChange={(checked) => onToggleActive(table.id, checked)}
          />
        </Space>
      </div>
    </Card>
  )
}

export default TableQRCard
