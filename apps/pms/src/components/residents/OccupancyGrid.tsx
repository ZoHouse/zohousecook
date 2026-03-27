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

  const daysUntilCheckout = daysBetween(day, departure)

  if (daysUntilCheckout <= 3) return '#7f1d1d' // red — checkout within 3 days
  if (daysUntilCheckout <= 7) return '#78350f' // yellow — checkout within 7 days
  if ((entry.total ?? 0) === 0) return '#374151' // gray — comp
  return '#065f46' // green — occupied (paying)
}

const OccupancyGrid: React.FC<OccupancyGridProps> = ({ entries, days }) => {
  const todayStr = formatDate(new Date())

  // Get sorted unique room names
  const rooms = useMemo(() => {
    const roomSet = new Set<string>()
    entries.forEach((e) => {
      if (e.roomname) roomSet.add(e.roomname)
    })
    return Array.from(roomSet).sort()
  }, [entries])

  // Build a lookup: roomname -> array of entries
  const roomEntries = useMemo(() => {
    const map: Record<string, OccupancyEntry[]> = {}
    entries.forEach((e) => {
      if (!e.roomname) return
      if (!map[e.roomname]) map[e.roomname] = []
      map[e.roomname].push(e)
    })
    return map
  }, [entries])

  // Find the entry covering a specific room on a specific day
  function findEntry(room: string, day: Date): OccupancyEntry | null {
    const dayStr = formatDate(day)
    const candidates = roomEntries[room] || []
    for (const entry of candidates) {
      const arrival = entry.arrivaldate || ''
      const departure = entry.departuredate || ''
      if (arrival <= dayStr && dayStr < departure) {
        return entry
      }
    }
    return null
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
                minWidth: 120,
                color: '#cfff50',
              }}
            >
              Room
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
          {rooms.map((room) => (
            <tr key={room}>
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
                }}
              >
                {room}
              </td>
              {days.map((day) => {
                const entry = findEntry(room, day)
                const isToday = formatDate(day) === todayStr
                const bgColor = entry
                  ? getCellColor(entry, day)
                  : isToday
                    ? '#1a2a1a'
                    : 'transparent'

                const cell = (
                  <td
                    key={formatDate(day)}
                    style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #222',
                      background: bgColor,
                      cursor: entry ? 'pointer' : 'default',
                      minWidth: 44,
                      height: 28,
                    }}
                  />
                )

                if (entry) {
                  return (
                    <Tooltip
                      key={formatDate(day)}
                      title={`${entry.guestname || 'Unknown'} — checkout ${entry.departuredate || '?'}`}
                    >
                      {cell}
                    </Tooltip>
                  )
                }

                return cell
              })}
            </tr>
          ))}
          {rooms.length === 0 && (
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
