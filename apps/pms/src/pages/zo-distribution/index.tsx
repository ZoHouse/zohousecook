import { useQueryApi } from "@zo/auth"
import { GeneralObject } from "@zo/definitions/general"
import { Alert, Card, Col, Empty, Row, Spin, Statistic, Table, Tag, Typography } from "antd"
import type { TableColumnsType } from "antd"
import { NextPage } from "next"
import React, { useMemo } from "react"
import ZoHouseGuard from "../../components/helpers/app/ZoHouseGuard"
import { Page, PageContent, PageHeader } from "../../components/ui"
import useAssociation from "../../hooks/useAssociation"
import {
  AIRDROP_STATUS,
  AIRDROP_STATUS_LABELS,
  BASESCAN_URL,
  OPERATOR_CITY_WALLETS,
} from "../../configs/zo-distribution"

const { Text } = Typography

// ---------------------------------------------------------------------------
// Types (matching Django API response shapes)
// ---------------------------------------------------------------------------

interface TokenGrant {
  id: string
  name: string
  allowance: string
  wallet_address: string
  start_date: string | null
  end_date: string | null
}

interface TokenAirdrop {
  id: string
  status: number
  wallet_address: string
  amount: string
  allocated_at: string
  ref_note: string | null
  grant: TokenGrant | string
  transaction: { hash: string } | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatZo(raw: string | number): string {
  const num = Number(raw) / 1e18
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  if (num >= 1) return num.toFixed(0)
  return num.toFixed(2)
}

function truncateWallet(addr: string): string {
  if (!addr || addr.length < 10) return addr || "—"
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const ZoDistributionPage: NextPage = () => {
  const { selectedOperator } = useAssociation()
  const operatorCode = selectedOperator?.code as string | undefined
  const cityWallet = operatorCode ? OPERATOR_CITY_WALLETS[operatorCode] : undefined

  // ---- Data fetching -------------------------------------------------------

  const { data: grantsData, isLoading: loadingGrants } = useQueryApi<GeneralObject>(
    "CAS_TOKEN_GRANTS",
    {
      enabled: !!cityWallet,
      refetchOnWindowFocus: false,
      select: (d: GeneralObject) => d.data,
    },
    "",
    `wallet_address=${cityWallet}`
  )

  const { data: airdropsData, isLoading: loadingAirdrops } = useQueryApi<GeneralObject>(
    "CAS_TOKEN_AIRDROPS",
    {
      enabled: !!cityWallet,
      refetchOnWindowFocus: false,
      select: (d: GeneralObject) => d.data,
    },
    "",
    `grant__wallet_address=${cityWallet}&ordering=-allocated_at&page_size=100`
  )

  const grants: TokenGrant[] = grantsData?.results || grantsData || []
  const airdrops: TokenAirdrop[] = airdropsData?.results || airdropsData || []

  // ---- Computed stats -------------------------------------------------------

  const stats = useMemo(() => {
    const successAirdrops = airdrops.filter((a) => a.status === AIRDROP_STATUS.SUCCESS)
    const pendingAirdrops = airdrops.filter(
      (a) => a.status === AIRDROP_STATUS.PENDING || a.status === AIRDROP_STATUS.INITIATED
    )

    const totalDistributed = successAirdrops.reduce(
      (sum, a) => sum + Number(a.amount),
      0
    )

    const uniqueWallets = new Set(successAirdrops.map((a) => a.wallet_address))

    return {
      totalDistributed,
      citizensOnboarded: uniqueWallets.size,
      pendingCount: pendingAirdrops.length,
    }
  }, [airdrops])

  // ---- Breakdown by grant ---------------------------------------------------

  const breakdown = useMemo(() => {
    const successAirdrops = airdrops.filter((a) => a.status === AIRDROP_STATUS.SUCCESS)
    const byGrant = new Map<string, { name: string; amount: number; count: number }>()

    for (const a of successAirdrops) {
      const grantId = typeof a.grant === "string" ? a.grant : a.grant?.id || "unknown"
      const grantName = typeof a.grant === "object" && a.grant?.name ? a.grant.name : "Unknown Grant"

      if (!byGrant.has(grantId)) {
        byGrant.set(grantId, { name: grantName, amount: 0, count: 0 })
      }
      const entry = byGrant.get(grantId)!
      entry.amount += Number(a.amount)
      entry.count++
    }

    const total = stats.totalDistributed || 1
    return Array.from(byGrant.values())
      .map((g) => ({ ...g, percent: ((g.amount / total) * 100).toFixed(1) }))
      .sort((a, b) => b.amount - a.amount)
  }, [airdrops, stats.totalDistributed])

  // ---- Table columns --------------------------------------------------------

  const airdropColumns: TableColumnsType<TokenAirdrop> = [
    {
      title: "Date",
      dataIndex: "allocated_at",
      key: "date",
      width: 140,
      render: (v: string) => (v ? formatDate(v) : "—"),
    },
    {
      title: "Recipient",
      dataIndex: "wallet_address",
      key: "wallet",
      width: 140,
      render: (v: string) => (
        <a
          href={`${BASESCAN_URL}/address/${v}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontFamily: "monospace", fontSize: 12 }}
        >
          {truncateWallet(v)}
        </a>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      align: "right" as const,
      render: (v: string) => (
        <Text strong style={{ fontFamily: "monospace" }}>
          {formatZo(v)} $Zo
        </Text>
      ),
    },
    {
      title: "Type",
      dataIndex: "ref_note",
      key: "type",
      width: 160,
      ellipsis: true,
      render: (v: string | null) => v || "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (v: number) => {
        const cfg = AIRDROP_STATUS_LABELS[v] || { label: `${v}`, color: "default" }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: "Tx",
      dataIndex: "transaction",
      key: "tx",
      width: 80,
      render: (_: unknown, record: TokenAirdrop) => {
        if (record.status !== AIRDROP_STATUS.SUCCESS || !record.transaction?.hash) return "—"
        return (
          <a
            href={`${BASESCAN_URL}/tx/${record.transaction.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: "monospace", fontSize: 11 }}
          >
            {record.transaction.hash.slice(0, 8)}…
          </a>
        )
      },
    },
  ]

  // ---- Render ---------------------------------------------------------------

  const isLoading = loadingGrants || loadingAirdrops

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="$Zo Distribution" icon="Vibe" />
        <PageContent>
          {!cityWallet ? (
            <Alert
              type="info"
              showIcon
              message="City wallet not configured for this property"
              description="Add the city wallet address in zo-distribution.ts to enable this dashboard."
            />
          ) : isLoading ? (
            <div className="flex justify-center py-20">
              <Spin size="large" />
            </div>
          ) : airdrops.length === 0 && grants.length === 0 ? (
            <Empty description="No $Zo distributions for this property yet" />
          ) : (
            <>
              {/* KPI Cards */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={8}>
                  <Card size="small">
                    <Statistic
                      title="Total $Zo Distributed"
                      value={formatZo(stats.totalDistributed)}
                      suffix="$Zo"
                      valueStyle={{ color: "#cfff50", fontFamily: "monospace" }}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card size="small">
                    <Statistic
                      title="Unique Wallets"
                      value={stats.citizensOnboarded}
                      valueStyle={{ color: "#1890ff" }}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card size="small">
                    <Statistic
                      title="Pending Airdrops"
                      value={stats.pendingCount}
                      valueStyle={{
                        color: stats.pendingCount > 0 ? "#faad14" : undefined,
                      }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Distribution Breakdown */}
              {breakdown.length > 0 && (
                <Card
                  size="small"
                  title="Distribution by Type"
                  style={{ marginBottom: 24 }}
                  styles={{ header: { fontSize: 14, fontWeight: 600 } }}
                >
                  <Table
                    dataSource={breakdown}
                    rowKey="name"
                    size="small"
                    pagination={false}
                    columns={[
                      { title: "Grant", dataIndex: "name", key: "name" },
                      {
                        title: "Amount",
                        dataIndex: "amount",
                        key: "amount",
                        align: "right" as const,
                        render: (v: number) => (
                          <Text style={{ fontFamily: "monospace" }}>
                            {formatZo(v)} $Zo
                          </Text>
                        ),
                      },
                      {
                        title: "%",
                        dataIndex: "percent",
                        key: "percent",
                        width: 70,
                        align: "right" as const,
                        render: (v: string) => `${v}%`,
                      },
                      {
                        title: "Airdrops",
                        dataIndex: "count",
                        key: "count",
                        width: 90,
                        align: "right" as const,
                      },
                    ]}
                  />
                </Card>
              )}

              {/* Recent Distributions */}
              <Card
                size="small"
                title="Recent Distributions"
                styles={{ header: { fontSize: 14, fontWeight: 600 } }}
              >
                <Table<TokenAirdrop>
                  dataSource={airdrops}
                  columns={airdropColumns}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 20, showSizeChanger: false }}
                  scroll={{ x: 740 }}
                />
              </Card>
            </>
          )}
        </PageContent>
      </Page>
    </ZoHouseGuard>
  )
}

export default ZoDistributionPage
