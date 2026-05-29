import React, { useState } from 'react'
import { Button, DatePicker, Dropdown, Modal } from 'antd'
import type { MenuProps } from 'antd'
import dayjs, { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

// Discriminated union: presets are "floating" (today's meaning of "Last 7
// days" is different from next week's), so we store the preset KEY and
// resolve to actual dates at read time. Custom is frozen to absolute dates.
export type DateFilterValue =
  | { kind: 'preset'; key: PresetKey }
  | { kind: 'custom'; from: string; to: string }

export type PresetKey = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth'

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 days' },
  { key: 'last30', label: 'Last 30 days' },
  { key: 'thisMonth', label: 'This month' },
]

/**
 * Resolve a DateFilterValue into an inclusive [from, to] pair in
 * YYYY-MM-DD. Presets are evaluated against today; custom is passed through.
 */
export function resolveRange(value: DateFilterValue): { from: string; to: string } {
  if (value.kind === 'custom') return { from: value.from, to: value.to }
  const today = dayjs()
  switch (value.key) {
    case 'today':
      return { from: today.format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }
    case 'yesterday': {
      const d = today.subtract(1, 'day')
      return { from: d.format('YYYY-MM-DD'), to: d.format('YYYY-MM-DD') }
    }
    case 'last7':
      return { from: today.subtract(6, 'day').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }
    case 'last30':
      return { from: today.subtract(29, 'day').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }
    case 'thisMonth':
      return { from: today.startOf('month').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }
  }
}

/** True iff the resolved range is exactly today (used to gate the live Active card). */
export function isTodayOnly(value: DateFilterValue): boolean {
  const today = dayjs().format('YYYY-MM-DD')
  const { from, to } = resolveRange(value)
  return from === today && to === today
}

/** Compact, human-friendly label for the dropdown trigger. */
function buttonLabel(value: DateFilterValue): string {
  if (value.kind === 'preset') {
    return PRESETS.find((p) => p.key === value.key)?.label ?? 'Today'
  }
  const from = dayjs(value.from)
  const to = dayjs(value.to)
  if (value.from === value.to) return from.format('MMM D, YYYY')
  if (from.year() === to.year()) {
    return `${from.format('MMM D')} – ${to.format('MMM D, YYYY')}`
  }
  return `${from.format('MMM D, YYYY')} – ${to.format('MMM D, YYYY')}`
}

interface DashboardDateFilterProps {
  value: DateFilterValue
  onChange: (next: DateFilterValue) => void
}

/**
 * Top-right dropdown that drives the dashboard's date range. Presets cover
 * the common "yesterday / last week / this month" cases in one click; the
 * "Custom range…" item opens a modal with an Antd RangePicker for arbitrary
 * date pairs. Future dates are disabled in the picker — there's no data
 * there yet to show.
 */
export function DashboardDateFilter({ value, onChange }: DashboardDateFilterProps) {
  const [customOpen, setCustomOpen] = useState(false)
  const [draftRange, setDraftRange] = useState<[Dayjs, Dayjs] | null>(null)

  const items: MenuProps['items'] = [
    ...PRESETS.map((p) => ({
      key: p.key,
      label:
        value.kind === 'preset' && value.key === p.key ? `✓  ${p.label}` : `   ${p.label}`,
    })),
    { type: 'divider' as const },
    {
      key: 'custom',
      label: value.kind === 'custom' ? `✓  Custom range…` : `   Custom range…`,
    },
  ]

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'custom') {
      // Seed the picker with the currently effective range so users see
      // what's already selected when the modal opens.
      const { from, to } = resolveRange(value)
      setDraftRange([dayjs(from), dayjs(to)])
      setCustomOpen(true)
      return
    }
    onChange({ kind: 'preset', key: key as PresetKey })
  }

  const applyCustom = () => {
    if (!draftRange || !draftRange[0] || !draftRange[1]) return
    const [start, end] = draftRange
    // Tolerate a user picking the dates in reverse order — sort them so the
    // SQL gte/lte filter doesn't return zero rows for a "backwards" range.
    const from = (start.isAfter(end) ? end : start).format('YYYY-MM-DD')
    const to = (start.isAfter(end) ? start : end).format('YYYY-MM-DD')
    onChange({ kind: 'custom', from, to })
    setCustomOpen(false)
  }

  return (
    <>
      <Dropdown menu={{ items, onClick: handleMenuClick }} trigger={['click']}>
        <Button>
          📅&nbsp;&nbsp;{buttonLabel(value)}&nbsp;&nbsp;<span style={{ opacity: 0.55 }}>▾</span>
        </Button>
      </Dropdown>

      <Modal
        title="Custom range"
        open={customOpen}
        onCancel={() => setCustomOpen(false)}
        onOk={applyCustom}
        okText="Apply"
        okButtonProps={{ disabled: !draftRange || !draftRange[0] || !draftRange[1] }}
        destroyOnClose
        width={420}
      >
        <RangePicker
          style={{ width: '100%' }}
          value={draftRange}
          onChange={(dates) => {
            if (!dates || !dates[0] || !dates[1]) {
              setDraftRange(null)
              return
            }
            setDraftRange([dates[0], dates[1]])
          }}
          disabledDate={(d) => !!d && d.isAfter(dayjs().endOf('day'))}
        />
      </Modal>
    </>
  )
}
