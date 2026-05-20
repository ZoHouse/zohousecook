import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { NextPage } from 'next'
import {
  Button,
  DatePicker,
  message,
  Modal,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'
import { CopyOutlined, ImportOutlined } from '@ant-design/icons'
import { AddOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@mui/icons-material'
import moment from 'moment'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import ZoHouseGuard from '../../components/helpers/app/ZoHouseGuard'
import { Page, PageContent, PageHeader } from '../../components/ui'
import { useCafeMealPlans } from '../../hooks/cafe/useCafeMealPlans'
import { useCafeMenu } from '../../hooks/cafe/useCafeMenu'
import { supabase } from '../../configs/supabase'
import MenuItemForm from '../../components/cafe/MenuItemForm'
import type { MenuItem, MealType } from '../../types/cafe'

const { Text } = Typography

const DAY_COLUMN_WIDTH = 260

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() || 7
  if (day !== 1) {
    d.setDate(d.getDate() - (day - 1))
  }
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateISO(date: Date): string {
  // Local-time YYYY-MM-DD. .toISOString() would shift the day across the
  // local/UTC boundary (IST midnight → previous UTC day), causing items to
  // be filed under the wrong column when the user is east of UTC.
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

const MEAL_DEFAULTS: Record<MealType, { start: string; end: string }> = {
  breakfast: { start: '07:30:00', end: '10:00:00' },
  lunch: { start: '12:30:00', end: '14:30:00' },
  dinner: { start: '19:30:00', end: '22:00:00' },
}

const mealSlotRows: Array<{ key: MealType; label: string; subtitle: string; color: string; antColor: string }> = [
  { key: 'breakfast', label: 'Breakfast', subtitle: '7:30 AM — 10:00 AM', color: '#f59e0b', antColor: 'orange' },
  { key: 'lunch', label: 'Lunch', subtitle: '12:30 PM — 2:30 PM', color: '#22c55e', antColor: 'green' },
  { key: 'dinner', label: 'Dinner', subtitle: '7:30 PM — 10:00 PM', color: '#6366f1', antColor: 'purple' },
]

type RowData = { key: MealType; label: string; subtitle: string; color: string; antColor: string }

const CafeMealPlanPage: NextPage = () => {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [copyTargetDate, setCopyTargetDate] = useState<Dayjs | null>(null)
  const [copying, setCopying] = useState(false)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])

  // Add modal state
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addModalMealType, setAddModalMealType] = useState<MealType>('breakfast')
  const [addModalDate, setAddModalDate] = useState<Date>(new Date())
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | undefined>()
  const [isAdding, setIsAdding] = useState(false)

  // Create-new-item flow: opens MenuItemForm to add an item that isn't in the
  // menu yet, then auto-attaches it to the meal plan slot the user came from.
  const [createItemOpen, setCreateItemOpen] = useState(false)
  const [createItemCategoryId, setCreateItemCategoryId] = useState<string | undefined>()
  const { categories, createItem: createMenuItem } = useCafeMenu()

  // One-click import from the legacy `notes` text: splits each note on
  // commas / dashes, creates any missing menu items, and links them to the
  // matching slot. Skips slots that already have items.
  const [isImporting, setIsImporting] = useState(false)

  const from = formatDateISO(weekStart)
  const to = formatDateISO(addDays(weekStart, 6))

  const {
    plans, isLoading, error,
    createPlan, addItem, removeItem, copyPlans,
  } = useCafeMealPlans({ from, to })

  // Fetch all available menu items. Re-runnable after we create a new one
  // inline so the dropdown stays in sync.
  const refetchMenuItems = useCallback(async () => {
    const { data } = await supabase
      .from('cafe_menu_items')
      .select('*')
      .eq('is_available', true)
      .is('deleted_at', null)
      .order('name')
    setMenuItems(data || [])
  }, [])

  useEffect(() => {
    refetchMenuItems()
  }, [refetchMenuItems])

  const handlePrevWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, -7))
  }, [])

  const handleNextWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, 7))
  }, [])

  const openAddModal = useCallback((mealType: MealType, date: Date) => {
    setAddModalMealType(mealType)
    setAddModalDate(date)
    setSelectedMenuItemId(undefined)
    // Preselect a sensible category for any new item the user creates from
    // this slot: prefer one matching the meal name (e.g. "Breakfast"), fall
    // back to "Zo Meals", then to the first category overall.
    const byName = (needle: string) =>
      categories.find((c) => c.name.toLowerCase().includes(needle.toLowerCase()))
    const guess =
      byName(mealType)?.id ||
      byName('zo meals')?.id ||
      categories[0]?.id
    setCreateItemCategoryId(guess)
    setAddModalOpen(true)
  }, [categories])

  const handleAddItem = useCallback(async () => {
    if (!selectedMenuItemId) return
    setIsAdding(true)
    try {
      const dateKey = formatDateISO(addModalDate)
      let plan = plans.find(p => p.date === dateKey && p.meal_type === addModalMealType)

      if (!plan) {
        const defaults = MEAL_DEFAULTS[addModalMealType]
        const newPlan = await createPlan(dateKey, addModalMealType, defaults.start, defaults.end)
        if (!newPlan) {
          message.error('Failed to create meal plan')
          return
        }
        // After createPlan, silentRefetch runs — use the fresh plans from state
        // We need the newly created plan's id — use newPlan directly
        await addItem(newPlan.id, selectedMenuItemId)
      } else {
        await addItem(plan.id, selectedMenuItemId)
      }

      setAddModalOpen(false)
      setSelectedMenuItemId(undefined)
    } catch {
      message.error('Failed to add item')
    } finally {
      setIsAdding(false)
    }
  }, [selectedMenuItemId, addModalDate, addModalMealType, plans, createPlan, addItem])

  // Create a new menu item, then attach it to the meal plan slot the modal
  // is currently focused on. Reuses the regular MenuItemForm so the user
  // gets the full create UI (image upload, recipe, nutrition, AI fill).
  const handleCreateAndAttachItem = useCallback(
    async (data: Record<string, unknown>): Promise<string | null> => {
      try {
        const newId = await createMenuItem(data)
        if (!newId) {
          message.error('Failed to create item')
          return null
        }
        // Refresh the dropdown so the new item is visible if the user reopens
        // the modal later.
        await refetchMenuItems()
        // Make sure the meal plan exists, then attach.
        const dateKey = formatDateISO(addModalDate)
        let plan = plans.find(p => p.date === dateKey && p.meal_type === addModalMealType)
        if (!plan) {
          const defaults = MEAL_DEFAULTS[addModalMealType]
          const newPlan = await createPlan(dateKey, addModalMealType, defaults.start, defaults.end)
          if (!newPlan) {
            message.error('Item created, but failed to create meal plan slot')
            return newId
          }
          await addItem(newPlan.id, newId)
        } else {
          await addItem(plan.id, newId)
        }
        message.success('Item created and added to meal plan')
        setCreateItemOpen(false)
        setAddModalOpen(false)
        setSelectedMenuItemId(undefined)
        return newId
      } catch {
        message.error('Failed to create item')
        return null
      }
    },
    [createMenuItem, addModalDate, addModalMealType, plans, createPlan, addItem, refetchMenuItems],
  )

  const handleImportFromNotes = useCallback(async () => {
    setIsImporting(true)
    try {
      // Only touch slots that still have legacy notes and no items linked.
      const candidates = plans.filter(
        (p) => p.notes && p.notes.trim().length > 0 && p.items.length === 0,
      )
      if (candidates.length === 0) {
        message.info('Nothing to import — every slot in this week either has items or no notes.')
        return
      }

      // Pick a default category for any newly created items.
      const defaultCatId =
        categories.find((c) => /zo meal/i.test(c.name))?.id ||
        categories[0]?.id
      if (!defaultCatId) {
        message.error('No menu category exists — create one before importing.')
        return
      }

      // Parser: split on commas, em/en/hyphen dashes (with surrounding spaces
      // so we don't break hyphenated names). "&" and "and" are kept inline so
      // combined dishes like "patta gobi & aloo dry" stay one item.
      const splitNotes = (notes: string): string[] =>
        notes
          .split(/\s*,\s*|\s+[-—–]\s+/)
          .map((s) => s.trim())
          .filter((s) => s.length >= 2 && s.length <= 80)

      const toTitle = (s: string): string =>
        s.replace(/\b([a-z])/g, (m) => m.toUpperCase())

      // Build a lookup of known items by normalised name so we can reuse
      // anything that already exists (Tea, Dal, etc.) instead of creating
      // duplicates.
      const knownByName = new Map<string, string>()
      for (const m of menuItems) knownByName.set(m.name.trim().toLowerCase(), m.id)

      let attached = 0
      let created = 0

      for (const plan of candidates) {
        const parts = splitNotes(plan.notes || '')
        for (const raw of parts) {
          const titled = toTitle(raw)
          const key = titled.toLowerCase()
          let itemId = knownByName.get(key)
          if (!itemId) {
            const newId = await createMenuItem({
              category_id: defaultCatId,
              name: titled,
              price: 0,
              diet: 'veg',
              is_available: true,
            })
            if (!newId) continue
            itemId = newId
            knownByName.set(key, newId)
            created++
          }
          await addItem(plan.id, itemId)
          attached++
        }
      }

      await refetchMenuItems()
      message.success(
        `Imported ${attached} item${attached === 1 ? '' : 's'} (${created} new menu item${created === 1 ? '' : 's'} created)`,
      )
    } catch (err) {
      console.error('Import error:', err)
      message.error('Import failed — check console')
    } finally {
      setIsImporting(false)
    }
  }, [plans, categories, menuItems, createMenuItem, addItem, refetchMenuItems])

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
  const weekLabel = `${moment(weekStart).format('D MMMM YYYY')} — ${moment(weekEnd).format('D MMMM YYYY')}`

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  const renderCell = useCallback(
    (mealType: MealType, date: Date, antColor: string) => {
      const dateKey = moment(date).format('YYYY-MM-DD')
      const plan = plans.find(p => p.date === dateKey && p.meal_type === mealType)

      return (
        <div style={{ padding: 8 }}>
          {plan && plan.items.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
              {plan.items.map(item => (
                <Tag
                  key={item.id}
                  closable
                  onClose={(e) => {
                    e.preventDefault()
                    removeItem(plan.id, item.id)
                  }}
                  color={antColor}
                  style={{ margin: 0 }}
                >
                  {item.menu_item?.name || 'Item'}
                </Tag>
              ))}
            </div>
          )}
          <Button
            type="dashed"
            icon={<AddOutlined style={{ fontSize: 14 }} />}
            style={{ width: '100%' }}
            size="small"
            onClick={() => openAddModal(mealType, date)}
          >
            Add Meal
          </Button>
        </div>
      )
    },
    [plans, removeItem, openAddModal]
  )

  const tableColumns: TableColumnsType<RowData> = useMemo(() => {
    const firstCol: TableColumnsType<RowData>[number] = {
      title: <div style={{ fontWeight: 600 }}>Meal Slot</div>,
      dataIndex: 'label',
      key: 'label',
      width: 180,
      fixed: 'left' as const,
      render: (_: string, record: RowData) => (
        <div style={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
          <div style={{ fontWeight: 600, color: record.color, fontSize: 13 }}>{record.label}</div>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{record.subtitle}</Typography.Text>
        </div>
      ),
    }

    const dayCols: TableColumnsType<RowData> = weekDates.map((date, idx) => {
      const isToday = moment(date).isSame(moment(), 'day')
      return {
        title: (
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontWeight: 700 }}>
              {new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date)}
            </div>
            <div style={{ fontSize: 12, color: isToday ? '#f97316' : '#8c8c8c' }}>
              {moment(date).format('D MMM')}
            </div>
          </div>
        ),
        dataIndex: moment(date).format('YYYY-MM-DD'),
        key: moment(date).format('YYYY-MM-DD'),
        width: DAY_COLUMN_WIDTH,
        onHeaderCell: () => ({
          className: [isToday ? 'is-today' : '', idx === 0 ? 'is-first-day' : ''].filter(Boolean).join(' ') || undefined,
        }),
        onCell: () => ({
          className: [isToday ? 'is-today' : '', idx === 0 ? 'is-first-day' : ''].filter(Boolean).join(' ') || undefined,
        }),
        render: (_: unknown, record: RowData) => renderCell(record.key, date, record.antColor),
      }
    })

    return [firstCol, ...dayCols]
  }, [weekDates, renderCell])

  const dataSource: RowData[] = useMemo(
    () => mealSlotRows.map(row => ({ ...row })),
    []
  )

  // Items already added for the currently open modal slot
  const addModalDateKey = formatDateISO(addModalDate)
  const addModalPlan = plans.find(p => p.date === addModalDateKey && p.meal_type === addModalMealType)
  const addedItemIds = new Set(addModalPlan?.items.map(i => i.menu_item_id) || [])
  const availableMenuItems = menuItems.filter(m => !addedItemIds.has(m.id))

  return (
    <ZoHouseGuard>
      <Page>
        <PageHeader title="Meal Plan" icon="Calendar" />
        <PageContent>
          {/* Header: date range + navigation */}
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
            <div>
              <Typography.Title level={5} style={{ margin: 0 }}>
                Meal Plan Calendar
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {weekLabel}
              </Typography.Text>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button
                icon={<ImportOutlined />}
                onClick={handleImportFromNotes}
                loading={isImporting}
                title="Convert each slot's legacy notes text into linked menu items"
              >
                Import from Notes
              </Button>
              <Button
                icon={<CopyOutlined />}
                onClick={() => setCopyModalOpen(true)}
              >
                Copy Week
              </Button>
              <Button
                icon={<ArrowLeftOutlined style={{ fontSize: 14 }} />}
                onClick={handlePrevWeek}
              >
                Previous Week
              </Button>
              <Button
                icon={<ArrowRightOutlined style={{ fontSize: 14 }} />}
                onClick={handleNextWeek}
              >
                Next Week
              </Button>
            </div>
          </div>

          {error && (
            <div style={{ color: '#ef4444', marginBottom: 16, fontSize: 13 }}>{error}</div>
          )}

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table<RowData>
              columns={tableColumns}
              dataSource={dataSource}
              pagination={false}
              scroll={{ x: 1400 }}
              bordered
              size="middle"
              rowKey="key"
              style={{ background: 'transparent' }}
            />
          )}
        </PageContent>
      </Page>

      {/* Add item modal */}
      <Modal
        open={addModalOpen}
        title={`Add item — ${mealSlotRows.find(r => r.key === addModalMealType)?.label} · ${moment(addModalDate).format('ddd D MMM')}`}
        okText={isAdding ? 'Adding...' : 'Add'}
        cancelText="Cancel"
        onOk={handleAddItem}
        onCancel={() => { setAddModalOpen(false); setSelectedMenuItemId(undefined) }}
        okButtonProps={{ disabled: !selectedMenuItemId, loading: isAdding }}
        destroyOnClose
        width={420}
      >
        {!addModalPlan && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
            No plan exists for this slot yet — one will be created automatically.
          </Text>
        )}
        <Select
          placeholder="Search menu items..."
          showSearch
          style={{ width: '100%' }}
          value={selectedMenuItemId}
          onChange={setSelectedMenuItemId}
          filterOption={(input, option) =>
            String(option?.label || '').toLowerCase().includes(input.toLowerCase())
          }
          options={availableMenuItems.map(m => ({ label: m.name, value: m.id }))}
        />

        {/* Create-new-item path: opens the full menu-item form, then attaches
            the created item to this slot. */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
            Don&apos;t see it? Add a brand-new menu item:
          </Text>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select
              placeholder="Category"
              style={{ flex: 1 }}
              value={createItemCategoryId}
              onChange={setCreateItemCategoryId}
              options={categories.map(c => ({ label: c.name, value: c.id }))}
            />
            <Button
              type="dashed"
              icon={<AddOutlined style={{ fontSize: 14 }} />}
              disabled={!createItemCategoryId}
              onClick={() => setCreateItemOpen(true)}
            >
              Create new item
            </Button>
          </div>
        </div>
      </Modal>

      {/* MenuItemForm — same form used by the cafe menu page. After submit
          we auto-attach the new item to the meal plan slot via
          handleCreateAndAttachItem. */}
      {createItemOpen && createItemCategoryId && (
        <MenuItemForm
          open={createItemOpen}
          onClose={() => setCreateItemOpen(false)}
          onSubmit={handleCreateAndAttachItem}
          categoryId={createItemCategoryId}
        />
      )}

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
