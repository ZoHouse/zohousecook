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

interface BedRow {
  label: string         // "Gutter Den #3" or "721A"
  roomName: string
  roomType: 'private' | 'dorm'
  bedIndex: number      // 0 for private, 0-N for dorm beds
  roomtypeunkid: string
  guest: OccupancyEntry | null  // assigned guest (by arrival order)
}

function getEntryColor(entry: OccupancyEntry, day: Date): string {
  if ((entry.total ?? 0) === 0) return '#374151' // gray — comp

  const departure = entry.departuredate ? new Date(entry.departuredate) : null
  if (!departure) return '#065f46'

  const daysLeft = daysBetween(day, departure)
  if (daysLeft <= 3) return '#7f1d1d'   // red
  if (daysLeft <= 7) return '#78350f'   // yellow
  return '#065f46'                       // green
}

function isOnDay(entry: OccupancyEntry, dayStr: string): boolean {
  const arrival = (entry.arrivaldate || '').split('T')[0]
  const departure = (entry.departuredate || '').split('T')[0]
  return arrival <= dayStr && dayStr < departure
}

const OccupancyGrid: React.FC<OccupancyGridProps> = ({ entries, days }) => {
  const todayStr = formatDate(new Date())

  // Build one row per bed
  const bedRows = useMemo(() => {
    // Group entries by room
    const roomMap = new Map<string, {
      roomName: string
      roomType: 'private' | 'dorm'
      roomBeds: number
      guests: OccupancyEntry[]
    }>()

    for (const entry of entries) {
      const key = entry.roomtypeunkid
      if (!roomMap.has(key)) {
        roomMap.set(key, {
          roomName: entry.roomName,
          roomType: entry.roomType,
          roomBeds: entry.roomBeds,
          guests: [],
        })
      }
      roomMap.get(key)!.guests.push(entry)
    }

    // Sort rooms: private first, then dorms alphabetically
    const sortedRooms = [...roomMap.entries()].sort(([, a], [, b]) => {
      if (a.roomType !== b.roomType) return a.roomType === 'private' ? -1 : 1
      return a.roomName.localeCompare(b.roomName)
    })

    const rows: BedRow[] = []

    for (const [roomtypeunkid, room] of sortedRooms) {
      // Sort guests by arrival date for consistent bed assignment
      const sortedGuests = [...room.guests].sort(
        (a, b) => (a.arrivaldate || '').localeCompare(b.arrivaldate || '')
      )

      if (room.roomType === 'private') {
        // Private room = 1 bed, 1 row
        rows.push({
          label: room.roomName,
          roomName: room.roomName,
          roomType: 'private',
          bedIndex: 0,
          roomtypeunkid,
          guest: sortedGuests[0] || null,
        })
      } else {
        // Dorm = N beds, N rows
        // Assign guests to beds: each unique guest gets a bed slot
        // (a guest who leaves and a new one arrives can reuse the same bed)
        for (let bedIdx = 0; bedIdx < room.roomBeds; bedIdx++) {
          rows.push({
            label: `${room.roomName} #${bedIdx + 1}`,
            roomName: room.roomName,
            roomType: 'dorm',
            bedIndex: bedIdx,
            roomtypeunkid,
            guest: sortedGuests[bedIdx] || null,
          })
        }
      }
    }

    return rows
  }, [entries])

  // For each bed row + day, find who occupies it
  function getOccupant(row: BedRow, day: Date): OccupancyEntry | null {
    if (!row.guest) return null
    const dayStr = formatDate(day)
    return isOnDay(row.guest, dayStr) ? row.guest : null
  }

  // Track room boundaries for visual grouping
  let lastRoomName = ''

  return (
    <div style={{ overflowX: 'auto', borderRadius: 8 }}>
      <h3 style={{ color: '#cfff50', fontSize: 14, marginBottom: 12, fontWeight: 500 }}>
        Bed Calendar — {days.length} Day View
      </h3>
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
                borderBottom: '1px solid #444',
                minWidth: 200,
                color: '#cfff50',
              }}
            >
              Bed
            </th>
            {days.map((day) => {
              const isToday = formatDate(day) === todayStr
              return (
                <th
                  key={formatDate(day)}
                  style={{
                    padding: '4px 6px',
                    textAlign: 'center',
                    borderBottom: '1px solid #444',
                    background: isToday ? '#1a2a1a' : '#141414',
                    color: isToday ? '#cfff50' : '#999',
                    minWidth: 44,
                    whiteSpace: 'nowrap',
                    fontWeight: isToday ? 700 : 400,
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
          {bedRows.map((row, rowIdx) => {
            const isNewRoom = row.roomName !== lastRoomName
            lastRoomName = row.roomName
            const borderTop = isNewRoom && rowIdx > 0 ? '2px solid #444' : undefined

            return (
              <tr key={`${row.roomtypeunkid}-${row.bedIndex}`}>
                <td
                  style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    background: '#1a1a1a',
                    padding: '3px 12px',
                    borderBottom: '1px solid #222',
                    borderTop,
                    color: isNewRoom ? '#ddd' : '#888',
                    fontWeight: isNewRoom ? 600 : 400,
                    whiteSpace: 'nowrap',
                    fontSize: isNewRoom ? 12 : 11,
                  }}
                >
                  {row.roomType === 'private' ? (
                    <span>{row.roomName} <span style={{ color: '#3b82f6', fontSize: 10 }}>pvt</span></span>
                  ) : (
                    <span>
                      {isNewRoom ? row.roomName : ''}
                      <span style={{ color: '#666' }}>
                        {isNewRoom ? ` #${row.bedIndex + 1}` : `#${row.bedIndex + 1}`}
                      </span>
                    </span>
                  )}
                </td>
                {days.map((day) => {
                  const occupant = getOccupant(row, day)
                  const isToday = formatDate(day) === todayStr
                  const bgColor = occupant
                    ? getEntryColor(occupant, day)
                    : isToday ? '#1a2a1a' : 'transparent'

                  const tooltipText = occupant
                    ? `${occupant.guestname}\nCheckout: ${occupant.departuredate?.split('T')[0]}${occupant.total === 0 ? '\n(comp)' : ''}`
                    : 'Available'

                  return (
                    <Tooltip
                      key={formatDate(day)}
                      title={<span style={{ whiteSpace: 'pre-line' }}>{tooltipText}</span>}
                    >
                      <td
                        style={{
                          padding: 0,
                          borderBottom: '1px solid #222',
                          borderTop,
                          background: bgColor,
                          minWidth: 44,
                          height: 26,
                        }}
                      />
                    </Tooltip>
                  )
                })}
              </tr>
            )
          })}
          {bedRows.length === 0 && (
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

      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: '#888' }}>
        <span><span style={{ background: '#065f46', padding: '2px 8px', borderRadius: 3 }}>&nbsp;</span> Occupied</span>
        <span><span style={{ background: '#78350f', padding: '2px 8px', borderRadius: 3 }}>&nbsp;</span> Checkout ≤7d</span>
        <span><span style={{ background: '#7f1d1d', padding: '2px 8px', borderRadius: 3 }}>&nbsp;</span> Checkout ≤3d</span>
        <span><span style={{ background: '#374151', padding: '2px 8px', borderRadius: 3 }}>&nbsp;</span> Comp</span>
      </div>
    </div>
  )
}

export default OccupancyGrid
