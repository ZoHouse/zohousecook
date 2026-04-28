// src/lib/cafe/kitchen-status.ts

import type { KitchenStatus } from '../../types/cafe'

const VALID_TRANSITIONS: Record<string, KitchenStatus[]> = {
  'null': ['new'],
  'new': ['accepted', 'cancelled'],
  'accepted': ['preparing', 'cancelled'],
  'preparing': ['ready', 'cancelled'],
  'ready': ['served', 'cancelled'],
}

const TERMINAL_STATES: KitchenStatus[] = ['served', 'cancelled']

export function isValidTransition(
  from: KitchenStatus | null,
  to: KitchenStatus
): boolean {
  const key = from === null ? 'null' : from
  if (TERMINAL_STATES.includes(from as KitchenStatus)) return false
  const allowed = VALID_TRANSITIONS[key]
  return allowed ? allowed.includes(to) : false
}

export function getNextActions(status: KitchenStatus | null): KitchenStatus[] {
  const key = status === null ? 'null' : status
  return VALID_TRANSITIONS[key] || []
}

export const KITCHEN_STATUS_LABELS: Record<KitchenStatus, string> = {
  draft: 'Awaiting Payment',
  new: 'New',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  cancelled: 'Cancelled',
}

export const KITCHEN_STATUS_COLORS: Record<KitchenStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  new: 'bg-blue-100 text-blue-800',
  accepted: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  served: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

// Kanban column order (excludes cancelled — shown separately)
export const KANBAN_COLUMNS: KitchenStatus[] = ['new', 'accepted', 'preparing', 'ready', 'served']

// Action button labels for advancing status
export const ADVANCE_ACTION_LABELS: Partial<Record<KitchenStatus, string>> = {
  new: 'Accept',
  accepted: 'Start Preparing',
  preparing: 'Mark Ready',
  ready: 'Mark Served',
}

// Aliases for parity with spec imports
export const STATUS_LABELS = KITCHEN_STATUS_LABELS

// Ant Design tag colors (for use with <Tag color="...">)
export const STATUS_TAG_COLORS: Record<KitchenStatus, string> = {
  draft: 'gold',
  new: 'blue',
  accepted: 'gold',
  preparing: 'orange',
  ready: 'green',
  served: 'default',
  cancelled: 'red',
}

/**
 * Returns the next logical kitchen status for advancing an order.
 * Returns null if the order is already in a terminal state.
 */
export function getNextStatus(current: KitchenStatus): KitchenStatus | null {
  const actions = getNextActions(current)
  // Return first non-cancelled next action
  return actions.find((s) => s !== 'cancelled') ?? null
}
