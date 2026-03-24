import React, { useState, useCallback, useEffect } from 'react'
import { NextPage } from 'next'
import {
  Button,
  DatePicker,
  message,
  Modal,
  Space,
  Spin,
  Typography,
} from 'antd'
import { LeftOutlined, RightOutlined, CopyOutlined } from '@ant-design/icons'
import moment from 'moment'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import { Page, PageContent, PageHeader } from '../../components/ui'
import MealPlanCalendar from '../../components/cafe/MealPlanCalendar'
import { useCafeMealPlans } from '../../hooks/cafe/useCafeMealPlans'
import { supabase } from '../../configs/supabase'
import type { MenuItem, MealType } from '../../types/cafe'

const { Text } = Typography

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() || 7 // Sunday=0 becomes 7
  if (day !== 1) {
    d.setDate(d.getDate() - (day - 1))
  }
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

const MEAL_DEFAULTS: Record<MealType, { start: string; end: string }> = {
  breakfast: { start: '07:00:00', end: '10:00:00' },
  lunch:     { start: '12:00:00', end: '14:30:00' },
  dinner:    { start: '19:00:00', end: '21:30:00' },
}

const CafeMealPlanPage: NextPage = () => {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [copyTargetDate, setCopyTargetDate] = useState<Dayjs | null>(null)
  const [copying, setCopying] = useState(false)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])

  const from = formatDateISO(weekStart)
  const to = formatDateISO(addDays(weekStart, 6))

  const {
    plans, isLoading, error,
    createPlan, addItem, removeItem, copyPlans,
  } = useCafeMealPlans({ from, to })

  // Fetch all menu items for the item picker
  useEffect(() => {
    supabase
      .from('cafe_menu_items')
      .select('*')
      .eq('is_available', true)
      .order('name')
      .then(({ data }) => setMenuItems(data || []))
  }, [])

  const handlePrevWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, -7))
  }, [])

  const handleNextWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, 7))
  }, [])

  const handleCreatePlan = useCallback(async (
    date: string,
    mealType: MealType,
    _servingStart: string,
    _servingEnd: string,
  ) => {
    const defaults = MEAL_DEFAULTS[mealType]
    await createPlan(date, mealType, defaults.start, defaults.end)
  }, [createPlan])

  const handleCopyWeek = useCallback(async () => {
    if (!copyTargetDate) return
    setCopying(true)
    try {
      const targetMonday = getMonday(copyTargetDate.toDate() as Date)
      const result = await copyPlans(from, to, formatDateISO(targetMonday))
      if (result) {
        message.success(`Copied: ${result.created} plans created, ${result.skipped} skipped`)
      } else {
        message.error('Copy failed')
      }
      setCopyModalOpen(false)
      setCopyTargetDate(null)
    } catch {
      message.error('Failed to copy week')
    } finally {
      setCopying(false)
    }
  }, [copyTargetDate, from, to, copyPlans])

  const weekEnd = addDays(weekStart, 6)
  const weekLabel = `${moment(weekStart).format('MMM D')} – ${moment(weekEnd).format('MMM D, YYYY')}`

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Meal Plan" icon="Calendar" />
        <PageContent>
          {/* Week navigation + copy */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <Space>
              <Button icon={<LeftOutlined />} onClick={handlePrevWeek}>Prev</Button>
              <Text strong style={{ fontSize: 15, minWidth: 200, textAlign: 'center', display: 'inline-block' }}>
                {weekLabel}
              </Text>
              <Button icon={<RightOutlined />} onClick={handleNextWeek}>Next</Button>
              <Button
                type="text"
                onClick={() => setWeekStart(getMonday(new Date()))}
                style={{ color: '#f97316' }}
              >
                Today
              </Button>
            </Space>

            <Button
              icon={<CopyOutlined />}
              onClick={() => setCopyModalOpen(true)}
            >
              Copy Week
            </Button>
          </div>

          {error && (
            <div style={{ color: '#ef4444', marginBottom: 16, fontSize: 13 }}>{error}</div>
          )}

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <Spin size="large" />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <MealPlanCalendar
                plans={plans}
                weekStart={weekStart}
                onCreatePlan={handleCreatePlan}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                menuItems={menuItems}
              />
            </div>
          )}
        </PageContent>
      </Page>

      {/* Copy week modal */}
      <Modal
        open={copyModalOpen}
        title="Copy Week to..."
        okText={copying ? 'Copying...' : 'Copy'}
        cancelText="Cancel"
        onOk={handleCopyWeek}
        onCancel={() => { setCopyModalOpen(false); setCopyTargetDate(null) }}
        okButtonProps={{ disabled: !copyTargetDate, loading: copying }}
        destroyOnClose
        width={380}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Pick any date in the target week. Plans will be copied to the Monday of that week.
        </Text>
        <DatePicker
          style={{ width: '100%' }}
          value={copyTargetDate}
          onChange={setCopyTargetDate}
          placeholder="Select target date"
          disabledDate={(d: Dayjs) => d.isBefore(dayjs(to))}
        />
      </Modal>
    </ZoHouseGuard>
  )
}

export default CafeMealPlanPage
