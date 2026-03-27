import React, { useMemo } from 'react'
import { Tooltip } from 'antd'
import { OccupancyEntry } from '../../hooks/residents/useOccupancy'

interface OccupancyGridProps {
  entries: OccupancyEntry[]
  days: Date[]
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function getCellColor(entry: OccupancyEntry, day: Date): string {
  const departure = entry.departuredate ? new Date(entry.departuredate) : null
  if (!departure) return '#065f46'

  const daysLeft = daysBetween(day, departure)

  if (daysLeft <= 3) return '#7f1d1d'   // red — checkout imminent
  if (daysLeft <= 7) return '#78350f'   // yellow — checkout soon
  if ((entry.total ?? 0) === 0) return '#374151' // gray — comp
  return '#065f46'                       // green — occupied
}

const OccupancyGrid: React.FC<OccupancyGridProps> = ({ entries, days }) => {
  const todayStr = formatDate(new Date())

  // Each entry = one row (one guest booking)
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => (a.guestname || '').localeCompare(b.guestname || '')),
    [entries]
  )

  function isOccupied(entry: OccupancyEntry, day: Date): boolean {
    const dayStr = formatDate(day)
    const arrival = (entry.arrivaldate || '').split('T')[0]
    const departure = (entry.departuredate || '').split('T')[0]
    return arrival <= dayStr && dayStr < departure
  }

  return (
    <div style={{ overflowX: 'auto', borderRadius: 8 }}>
      <table
        style={{
          borderCollapse: 'collapse',
          width: 'max-content',
          fontSize: 12,
          fontFamily: 'monospace',
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 2,
                background: '#141414',
                padding: '6px 12px',
                textAlign: 'left',
                borderBottom: '1px solid #333',
                minWidth: 180,
                color: '#cfff50',
              }}
            >
              Guest
            </th>
            {days.map((day) => {
              const isToday = formatDate(day) === todayStr
              return (
                <th
                  key={formatDate(day)}
                  style={{
                    padding: '4px 6px',
                    textAlign: 'center',
                    borderBottom: '1px solid #333',
                    background: isToday ? '#1a2a1a' : '#141414',
                    color: isToday ? '#cfff50' : '#999',
                    minWidth: 44,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div>{day.getDate()}</div>
                  <div style={{ fontSize: 10 }}>{DAY_NAMES[day.getDay()]}</div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map((entry) => (
            <tr key={entry.id}>
              <td
                style={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 1,
                  background: '#1a1a1a',
                  padding: '4px 12px',
                  borderBottom: '1px solid #222',
                  color: '#ddd',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {entry.guestname}
                {entry.total === 0 && (
                  <span style={{ color: '#666', marginLeft: 6, fontSize: 10 }}>comp</span>
                )}
              </td>
              {days.map((day) => {
                const occupied = isOccupied(entry, day)
                const isToday = formatDate(day) === todayStr
                const bgColor = occupied
                  ? getCellColor(entry, day)
                  : isToday
                    ? '#1a2a1a'
                    : 'transparent'

                const cell = (
                  <td
                    key={formatDate(day)}
                    style={{
                      padding: 0,
                      borderBottom: '1px solid #222',
                      background: bgColor,
                      minWidth: 44,
                      height: 28,
                    }}
                  />
                )

                if (occupied) {
                  const depDate = entry.departuredate?.split('T')[0] || '?'
                  return (
                    <Tooltip
                      key={formatDate(day)}
                      title={`${entry.guestname} — checkout ${depDate}`}
                    >
                      {cell}
                    </Tooltip>
                  )
                }

                return cell
              })}
            </tr>
          ))}
          {sortedEntries.length === 0 && (
            <tr>
              <td
                colSpan={days.length + 1}
                style={{ padding: 20, textAlign: 'center', color: '#666' }}
              >
                No occupancy data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default OccupancyGrid
