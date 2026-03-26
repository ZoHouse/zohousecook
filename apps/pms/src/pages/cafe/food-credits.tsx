import React, { useState, useCallback } from 'react'
import { NextPage } from 'next'
import {
  Button,
  Card,
  Col,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
import { SearchOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import { Page, PageContent, PageHeader } from '../../components/ui'
import { useFoodCredits } from '../../hooks/cafe/useFoodCredits'
import type { FoodCreditTransaction } from '../../types/cafe'

const { Text, Title } = Typography

const TYPE_COLORS: Record<string, string> = {
  issue: 'green',
  spend: 'orange',
  revoke: 'red',
  refund: 'blue',
}

const FoodCreditsPage: NextPage = () => {
  const {
    wallet, transactions, customerMatch, isLoading, stats,
    searchByPhone, issueCredits, revokeCredits,
    recentTransactions,
  } = useFoodCredits()

  const [phoneInput, setPhoneInput] = useState('')
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  // Issue modal
  const [issueOpen, setIssueOpen] = useState(false)
  const [issuePhone, setIssuePhone] = useState('')
  const [issueAmount, setIssueAmount] = useState<number>(0)
  const [issueName, setIssueName] = useState('')
  const [issueNote, setIssueNote] = useState('')
  const [issueLoading, setIssueLoading] = useState(false)

  // Revoke modal
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [revokeAmount, setRevokeAmount] = useState<number>(0)
  const [revokeReason, setRevokeReason] = useState('')
  const [revokeLoading, setRevokeLoading] = useState(false)

  const handleSearch = useCallback((value: string) => {
    setPhoneInput(value)
    if (searchTimer) clearTimeout(searchTimer)
    const timer = setTimeout(() => {
      if (value.replace(/\D/g, '').length >= 10) {
        searchByPhone(value)
      }
    }, 400)
    setSearchTimer(timer)
  }, [searchTimer, searchByPhone])

  const handleIssue = async () => {
    if (!issueAmount || issueAmount < 1) return
    const phone = issuePhone || phoneInput
    if (!phone) return
    setIssueLoading(true)
    try {
      await issueCredits(phone, issueAmount, issueName || undefined, issueNote || undefined)
      message.success(`Issued ${issueAmount} $food`)
      setIssueOpen(false)
      setIssueAmount(0)
      setIssueNote('')
      setIssueName('')
      setIssuePhone('')
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to issue')
    } finally {
      setIssueLoading(false)
    }
  }

  const handleRevoke = async () => {
    if (!wallet || !revokeAmount || revokeAmount < 1 || !revokeReason) return
    setRevokeLoading(true)
    try {
      await revokeCredits(wallet.id, revokeAmount, revokeReason)
      message.success(`Revoked ${revokeAmount} $food`)
      setRevokeOpen(false)
      setRevokeAmount(0)
      setRevokeReason('')
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to revoke')
    } finally {
      setRevokeLoading(false)
    }
  }

  const txnColumns: TableColumnsType<FoodCreditTransaction> = [
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'date',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (v: string) => <Tag color={TYPE_COLORS[v] || 'default'}>{v.toUpperCase()}</Tag>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 90,
      align: 'right',
      render: (v: number, r: FoodCreditTransaction) => (
        <Text strong style={{ color: r.type === 'issue' || r.type === 'refund' ? '#52c41a' : '#ff4d4f' }}>
          {r.type === 'issue' || r.type === 'refund' ? '+' : '-'}{v} $food
        </Text>
      ),
    },
    {
      title: 'Balance',
      dataIndex: 'balance_after',
      key: 'balance',
      width: 100,
      align: 'right',
      render: (v: number) => <Text code>{v} $food</Text>,
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (v: string | null) => v || '—',
    },
    {
      title: 'By',
      dataIndex: 'created_by',
      key: 'by',
      width: 80,
      render: (v: string | null) => v || '—',
    },
  ]

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="$food Credits" icon="NoteBook" />
        <PageContent>
          {/* Stats */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={8}>
              <Card size="small">
                <Statistic title="Total Issued" value={stats.totalIssued} suffix=" $food" valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic title="Total Spent" value={stats.totalSpent} suffix=" $food" valueStyle={{ color: '#faad14' }} />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic title="Outstanding" value={stats.totalOutstanding} suffix=" $food" valueStyle={{ color: '#1890ff' }} />
              </Card>
            </Col>
          </Row>

          {/* Search + Issue */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search by phone number..."
              value={phoneInput}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 280 }}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: '#cfff50', borderColor: '#cfff50', color: '#000' }}
              onClick={() => {
                setIssuePhone(phoneInput)
                setIssueOpen(true)
              }}
            >
              Issue $food
            </Button>
          </div>

          {/* Wallet detail */}
          {wallet ? (
            <Card style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <Title level={4} style={{ margin: 0 }}>{wallet.name || 'Unknown'}</Title>
                  <Text type="secondary">{wallet.phone}</Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'monospace', color: '#cfff50' }}>
                    {wallet.balance}
                  </div>
                  <Text type="secondary">$food balance</Text>
                </div>
              </div>
              <Space>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => { setIssuePhone(wallet.phone); setIssueOpen(true) }}
                  style={{ background: '#cfff50', borderColor: '#cfff50', color: '#000' }}
                >
                  Issue
                </Button>
                <Button
                  icon={<MinusOutlined />}
                  danger
                  onClick={() => setRevokeOpen(true)}
                  disabled={wallet.balance === 0}
                >
                  Revoke
                </Button>
              </Space>
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ fontSize: 13 }}>Transaction History</Text>
                <Table<FoodCreditTransaction>
                  dataSource={transactions}
                  columns={txnColumns}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 10, showSizeChanger: false }}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Card>
          ) : customerMatch ? (
            <Card style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <Title level={4} style={{ margin: 0 }}>{customerMatch.name || 'Unknown'}</Title>
                  <Text type="secondary">{customerMatch.phone}</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag>{customerMatch.orderCount} order{customerMatch.orderCount !== 1 ? 's' : ''}</Tag>
                    <Tag color="orange">No $food wallet yet</Tag>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'monospace', color: '#666' }}>
                    0
                  </div>
                  <Text type="secondary">$food balance</Text>
                </div>
              </div>
              <Button
                icon={<PlusOutlined />}
                onClick={() => { setIssuePhone(customerMatch.phone); setIssueName(customerMatch.name || ''); setIssueOpen(true) }}
                style={{ background: '#cfff50', borderColor: '#cfff50', color: '#000' }}
              >
                Issue first $food
              </Button>
            </Card>
          ) : (
            <div>
              <Text type="secondary" style={{ fontSize: 13, marginBottom: 12, display: 'block' }}>
                Recent activity across all wallets
              </Text>
              <Table<FoodCreditTransaction>
                dataSource={recentTransactions}
                columns={txnColumns}
                rowKey="id"
                size="small"
                loading={isLoading}
                pagination={false}
              />
            </div>
          )}
        </PageContent>
      </Page>

      {/* Issue Modal */}
      <Modal
        open={issueOpen}
        title="Issue $food Credits"
        okText="Issue"
        onOk={handleIssue}
        onCancel={() => setIssueOpen(false)}
        confirmLoading={issueLoading}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div>
            <Text style={{ fontSize: 12 }}>Phone</Text>
            <Input
              value={issuePhone}
              onChange={(e) => setIssuePhone(e.target.value)}
              placeholder="10-digit phone"
            />
          </div>
          <div>
            <Text style={{ fontSize: 12 }}>Name (optional)</Text>
            <Input
              value={issueName}
              onChange={(e) => setIssueName(e.target.value)}
              placeholder="Staff name"
            />
          </div>
          <div>
            <Text style={{ fontSize: 12 }}>Amount ($food)</Text>
            <InputNumber
              min={1}
              value={issueAmount}
              onChange={(v) => setIssueAmount(v || 0)}
              style={{ width: '100%' }}
              placeholder="e.g. 100"
            />
          </div>
          <div>
            <Text style={{ fontSize: 12 }}>Note</Text>
            <Input
              value={issueNote}
              onChange={(e) => setIssueNote(e.target.value)}
              placeholder="e.g. Staff meal perk"
            />
          </div>
        </div>
      </Modal>

      {/* Revoke Modal */}
      <Modal
        open={revokeOpen}
        title="Revoke $food Credits"
        okText="Revoke"
        okButtonProps={{ danger: true }}
        onOk={handleRevoke}
        onCancel={() => setRevokeOpen(false)}
        confirmLoading={revokeLoading}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div>
            <Text style={{ fontSize: 12 }}>Amount to revoke (max: {wallet?.balance ?? 0})</Text>
            <InputNumber
              min={1}
              max={wallet?.balance ?? 0}
              value={revokeAmount}
              onChange={(v) => setRevokeAmount(v || 0)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <Text style={{ fontSize: 12 }}>Reason (required)</Text>
            <Input.TextArea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Reason for revoking credits"
              rows={2}
            />
          </div>
        </div>
      </Modal>
    </ZoHouseGuard>
  )
}

export default FoodCreditsPage
