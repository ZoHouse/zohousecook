import { Alert, Button, Spin, Tabs } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { NextPage } from 'next'
import React, { useCallback, useMemo, useState } from 'react'
import { PnlSummary } from '../../components/pnl/PnlSummary'
import { ExpenseForm } from '../../components/pnl/ExpenseForm'
import { ExpenseList } from '../../components/pnl/ExpenseList'
import { GuestRevenueSearch } from '../../components/pnl/GuestRevenueSearch'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import { Page, PageContent, PageHeader } from '../../components/ui'
import { usePropertyId } from '../../hooks/cafe/usePropertyId'
import useAssociation from '../../hooks/useAssociation'
import { usePnlRevenue } from '../../hooks/pnl/usePnlRevenue'
import { useExpenses } from '../../hooks/pnl/useExpenses'
import { useGuestRevenue } from '../../hooks/pnl/useGuestRevenue'

// ---- Period helpers --------------------------------------------------------

type PeriodKey = 'mtd' | 'last_month'

function getPeriodDates(period: PeriodKey): { dateFrom: string; dateTo: string } {
  const today = dayjs()
  if (period === 'mtd') {
    return {
      dateFrom: today.startOf('month').format('YYYY-MM-DD'),
      dateTo: today.format('YYYY-MM-DD'),
    }
  }
  // last_month
  const lastMonth = today.subtract(1, 'month')
  return {
    dateFrom: lastMonth.startOf('month').format('YYYY-MM-DD'),
    dateTo: lastMonth.endOf('month').format('YYYY-MM-DD'),
  }
}

function getLastMonthKey(): string {
  return dayjs().subtract(1, 'month').format('YYYY-MM')
}

// ---- Page ------------------------------------------------------------------

const PnlPage: NextPage = () => {
  const { propertyId, isLoading: isLoadingProperty, operatorCode } = usePropertyId()
  const { hasAccess, selectedOperator } = useAssociation()

  const canEnterExpenses = hasAccess('property-manager')

  // Period state
  const [period, setPeriod] = useState<PeriodKey>('mtd')
  const { dateFrom, dateTo } = useMemo(() => getPeriodDates(period), [period])

  // Carry-forward state
  const [carryForwardDone, setCarryForwardDone] = useState(false)
  const [isCarryingForward, setIsCarryingForward] = useState(false)

  // Show carry-forward prompt only on first 5 days of month, for PM+
  const today = dayjs()
  const isFirstFiveDays = today.date() <= 5
  const showCarryForwardPrompt =
    canEnterExpenses && isFirstFiveDays && !carryForwardDone && period === 'mtd'

  // Hooks
  const { pnl, isLoading: isPnlLoading, refetch: refetchPnl } = usePnlRevenue({
    propertyId,
    operatorCode: operatorCode ?? null,
    dateFrom,
    dateTo,
  })

  const {
    expenses,
    isLoading: isExpensesLoading,
    refetch: refetchExpenses,
    addExpense,
    softDeleteExpense,
    carryForwardRecurring,
  } = useExpenses({ propertyId, dateFrom, dateTo })

  const { guest, isLoading: isGuestLoading, search: searchGuest } = useGuestRevenue()

  // Carry-forward handler
  const handleCarryForward = useCallback(async () => {
    if (!propertyId) return
    setIsCarryingForward(true)
    const count = await carryForwardRecurring(getLastMonthKey())
    setIsCarryingForward(false)
    setCarryForwardDone(true)
    if (count > 0) {
      refetchPnl()
    }
  }, [propertyId, carryForwardRecurring, refetchPnl])

  // Guest search wrapper — binds current period + property context
  const handleGuestSearch = useCallback(
    (query: string) => {
      if (!propertyId || !operatorCode) return
      searchGuest(query, propertyId, operatorCode, dateFrom, dateTo)
    },
    [propertyId, operatorCode, dateFrom, dateTo, searchGuest]
  )

  // The createdBy value for new expense entries
  const createdBy: string = (selectedOperator as any)?.user_email ?? (selectedOperator as any)?.email ?? 'unknown'

  const isLoading = isLoadingProperty

  // ---- Period selector UI --------------------------------------------------

  const periodButtons = (
    <div className="flex gap-2 mb-4">
      {(['mtd', 'last_month'] as PeriodKey[]).map((key) => (
        <button
          key={key}
          onClick={() => setPeriod(key)}
          className={[
            'px-3 py-1 rounded text-sm font-medium border transition-colors',
            period === key
              ? 'bg-zui-primary border-zui-primary text-white'
              : 'bg-transparent border-zui-border text-zui-silver hover:border-zui-primary hover:text-white',
          ].join(' ')}
        >
          {key === 'mtd' ? 'MTD' : 'Last Month'}
        </button>
      ))}
      <span className="ml-auto text-xs text-zui-silver self-center">
        {dateFrom} → {dateTo}
      </span>
    </div>
  )

  // ---- Tab items -----------------------------------------------------------

  const tabItems = [
    {
      key: 'summary',
      label: 'Summary',
      children: isPnlLoading ? (
        <div className="flex justify-center py-20">
          <Spin size="large" />
        </div>
      ) : pnl ? (
        <PnlSummary pnl={pnl} />
      ) : (
        <div className="text-center py-20 text-zui-silver">No data available</div>
      ),
    },
    ...(canEnterExpenses
      ? [
          {
            key: 'expenses',
            label: 'Expenses',
            children: (
              <div>
                {propertyId && (
                  <ExpenseForm
                    propertyId={propertyId}
                    createdBy={createdBy}
                    onSubmit={async (req) => {
                      const ok = await addExpense(req)
                      if (ok) refetchPnl()
                      return ok
                    }}
                  />
                )}
                <ExpenseList
                  expenses={expenses}
                  isLoading={isExpensesLoading}
                  canDelete={canEnterExpenses}
                  onDelete={async (id) => {
                    const ok = await softDeleteExpense(id)
                    if (ok) refetchPnl()
                    return ok
                  }}
                />
              </div>
            ),
          },
          {
            key: 'guest-revenue',
            label: 'Guest Revenue',
            children: (
              <GuestRevenueSearch
                guest={guest}
                isLoading={isGuestLoading}
                onSearch={handleGuestSearch}
              />
            ),
          },
        ]
      : []),
  ]

  // ---- Render --------------------------------------------------------------

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="P&L" icon="Rupee" />
        <PageContent>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spin size="large" />
            </div>
          ) : (
            <>
              {periodButtons}

              {showCarryForwardPrompt && (
                <Alert
                  className="mb-4"
                  type="info"
                  message="Carry forward recurring expenses?"
                  description="It's the start of the month. Would you like to copy last month's recurring expenses into this month?"
                  action={
                    <Button
                      size="small"
                      type="primary"
                      loading={isCarryingForward}
                      onClick={handleCarryForward}
                    >
                      Yes, carry forward
                    </Button>
                  }
                  closable
                  onClose={() => setCarryForwardDone(true)}
                />
              )}

              <Tabs items={tabItems} defaultActiveKey="summary" />
            </>
          )}
        </PageContent>
      </Page>
    </ZoHouseGuard>
  )
}

export default PnlPage
