import React, { useMemo, useState } from 'react'
import { Button, Modal, Select, Tag, Typography, Space } from 'antd'
import { PlusOutlined, CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import type { MealPlanWithItems, MealType, MenuItem } from '../../types/cafe'

const { Text } = Typography

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const MEAL_TYPES: { type: MealType; label: string; time: string; color: string; bg: string }[] = [
  { type: 'breakfast', label: 'Breakfast', time: '7:00–10:00', color: '#d97706', bg: '#fffbeb' },
  { type: 'lunch', label: 'Lunch', time: '12:00–14:30', color: '#16a34a', bg: '#f0fdf4' },
  { type: 'dinner', label: 'Dinner', time: '19:00–21:30', color: '#4f46e5', bg: '#eef2ff' },
]

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

interface MealCellProps {
  date: string
  mealType: MealType
  plan: MealPlanWithItems | undefined
  onCreatePlan: (date: string, mealType: MealType) => Promise<void>
  onAddItem: (planId: string, menuItemId: string) => Promise<void>
  onRemoveItem: (planId: string, itemId: string) => Promise<void>
  menuItems: MenuItem[]
  mealConfig: typeof MEAL_TYPES[number]
}

function MealCell({
  date, mealType, plan,
  onCreatePlan, onAddItem, onRemoveItem,
  menuItems, mealConfig,
}: MealCellProps) {
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>()
  const [creating, setCreating] = useState(false)
  const [adding, setAdding] = useState(false)

  const handleCreateAndOrAdd = async () => {
    if (!selectedItemId) return
    setAdding(true)
    try {
      let planId = plan?.id
      if (!planId) {
        setCreating(true)
        await onCreatePlan(date, mealType)
        // After create, the parent refetches. We need to wait for the new plan.
        // We'll close the modal and let user re-open — simpler UX than waiting.
        setCreating(false)
        setAddModalOpen(false)
        setSelectedItemId(undefined)
        return
      }
      await onAddItem(planId, selectedItemId)
      setSelectedItemId(undefined)
      setAddModalOpen(false)
    } finally {
      setAdding(false)
      setCreating(false)
    }
  }

  // Items already added to this plan
  const addedItemIds = new Set(plan?.items.map((i) => i.menu_item_id) || [])
  const availableItems = menuItems.filter((m) => !addedItemIds.has(m.id) && m.is_available)

  return (
    <div
      style={{
        background: mealConfig.bg,
        borderRadius: 6,
        padding: '6px 8px',
        marginBottom: 4,
        minHeight: 60,
      }}
    >
      {/* Meal type label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 10, fontWeight: 600, color: mealConfig.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {mealConfig.label}
        </Text>
        <Text style={{ fontSize: 10, color: '#9ca3af' }}>{mealConfig.time}</Text>
      </div>

      {/* Items */}
      {plan && plan.items.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
          {plan.items.map((item) => (
            <Tag
              key={item.id}
              closable
              onClose={() => onRemoveItem(plan.id, item.id)}
              closeIcon={<CloseOutlined style={{ fontSize: 9 }} />}
              style={{
                fontSize: 10,
                padding: '1px 5px',
                margin: 0,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.8)',
                border: `1px solid ${mealConfig.color}40`,
                color: '#374151',
              }}
            >
              {item.menu_item?.name || 'Item'}
            </Tag>
          ))}
        </div>
      )}

      {/* Add button */}
      <Button
        size="small"
        type="text"
        icon={<PlusOutlined style={{ fontSize: 10 }} />}
        onClick={() => setAddModalOpen(true)}
        style={{ fontSize: 10, height: 20, padding: '0 4px', color: mealConfig.color }}
      >
        Add
      </Button>

      {/* Add item modal */}
      <Modal
        open={addModalOpen}
        title={`Add item to ${mealConfig.label}`}
        okText={creating ? 'Creating plan...' : adding ? 'Adding...' : 'Add'}
        cancelText="Cancel"
        onOk={handleCreateAndOrAdd}
        onCancel={() => { setAddModalOpen(false); setSelectedItemId(undefined) }}
        okButtonProps={{ disabled: !selectedItemId, loading: adding || creating }}
        destroyOnClose
        width={400}
      >
        {!plan && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
            No plan exists for this slot yet — one will be created automatically.
          </Text>
        )}
        <Select
          placeholder="Search menu items..."
          showSearch
          style={{ width: '100%' }}
          value={selectedItemId}
          onChange={setSelectedItemId}
          filterOption={(input, option) =>
            String(option?.label || '').toLowerCase().includes(input.toLowerCase())
          }
          options={availableItems.map((m) => ({ label: m.name, value: m.id }))}
        />
      </Modal>
    </div>
  )
}

interface MealPlanCalendarProps {
  plans: MealPlanWithItems[]
  weekStart: Date
  onCreatePlan: (date: string, mealType: MealType, servingStart: string, servingEnd: string) => Promise<void>
  onAddItem: (planId: string, menuItemId: string) => Promise<void>
  onRemoveItem: (planId: string, itemId: string) => Promise<void>
  menuItems: MenuItem[]
}

const MealPlanCalendar: React.FC<MealPlanCalendarProps> = ({
  plans, weekStart,
  onCreatePlan, onAddItem, onRemoveItem,
  menuItems,
}) => {
  const today = formatDateISO(new Date())

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekStart])

  const weekEnd = weekDays[6]
  const weekLabel = `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()}–${weekEnd.getDate()}`

  return (
    <div>
      {/* Week label */}
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <Text strong style={{ fontSize: 14 }}>{weekLabel} {weekStart.getFullYear()}</Text>
      </div>

      {/* 7-col grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 8,
          minWidth: 560,
          overflowX: 'auto',
        }}
      >
        {weekDays.map((day, i) => {
          const dateStr = formatDateISO(day)
          const isToday = dateStr === today
          const dayPlans = plans.filter((p) => p.date === dateStr)

          return (
            <div key={dateStr}>
              {/* Day header */}
              <div
                style={{
                  textAlign: 'center',
                  padding: '6px 4px',
                  borderRadius: 6,
                  background: isToday ? '#f97316' : 'transparent',
                  marginBottom: 6,
                }}
              >
                <div style={{ fontSize: 10, color: isToday ? '#fff' : '#9ca3af', fontWeight: 500 }}>
                  {DAY_NAMES[i]}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: isToday ? '#fff' : '#111827' }}>
                  {day.getDate()}
                </div>
              </div>

              {/* Meal cells */}
              {MEAL_TYPES.map((mt) => {
                const plan = dayPlans.find((p) => p.meal_type === mt.type)
                return (
                  <MealCell
                    key={mt.type}
                    date={dateStr}
                    mealType={mt.type}
                    plan={plan}
                    onCreatePlan={async (d, t) => {
                      await onCreatePlan(d, t, mt.time.split('–')[0].trim() + ':00', mt.time.split('–')[1].trim() + ':00')
                    }}
                    onAddItem={onAddItem}
                    onRemoveItem={onRemoveItem}
                    menuItems={menuItems}
                    mealConfig={mt}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MealPlanCalendar
