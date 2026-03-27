import React, { useMemo } from 'react'
import { Tooltip, Tag } from 'antd'
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

interface RoomRow {
  roomName: string
  roomType: 'private' | 'dorm'
  roomBeds: number
  roomtypeunkid: string
  guests: OccupancyEntry[]
}

const OccupancyGrid: React.FC<OccupancyGridProps> = ({ entries, days }) => {
  const todayStr = formatDate(new Date())

  // Group entries by room
  const rooms = useMemo(() => {
    const roomMap = new Map<string, RoomRow>()

    for (const entry of entries) {
      const key = entry.roomtypeunkid
      if (!roomMap.has(key)) {
        roomMap.set(key, {
          roomName: entry.roomName,
          roomType: entry.roomType,
          roomBeds: entry.roomBeds,
          roomtypeunkid: key,
          guests: [],
        })
      }
      roomMap.get(key)!.guests.push(entry)
    }

    // Sort: private rooms first, then dorms
    return [...roomMap.values()].sort((a, b) => {
      if (a.roomType !== b.roomType) return a.roomType === 'private' ? -1 : 1
      return a.roomName.localeCompare(b.roomName)
    })
  }, [entries])

  function getGuestsOnDay(room: RoomRow, day: Date): OccupancyEntry[] {
    const dayStr = formatDate(day)
    return room.guests.filter((e) => {
      const arrival = (e.arrivaldate || '').split('T')[0]
      const departure = (e.departuredate || '').split('T')[0]
      return arrival <= dayStr && dayStr < departure
    })
  }

  function getCellColor(guests: OccupancyEntry[], day: Date): string {
    if (guests.length === 0) return 'transparent'

    const allComp = guests.every((g) => (g.total ?? 0) === 0)
    if (allComp) return '#374151' // gray — comp

    // Check closest checkout
    const minDaysLeft = Math.min(
      ...guests.map((g) =>
        g.departuredate ? daysBetween(day, new Date(g.departuredate)) : 999
      )
    )

    if (minDaysLeft <= 3) return '#7f1d1d' // red
    if (minDaysLeft <= 7) return '#78350f' // yellow
    return '#065f46' // green
  }

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
                borderBottom: '1px solid #333',
                minWidth: 200,
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
          {rooms.map((room) => (
            <tr key={room.roomtypeunkid}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{room.roomName}</span>
                  <Tag
                    style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px' }}
                    color={room.roomType === 'private' ? 'blue' : 'default'}
                  >
                    {room.roomType === 'private' ? 'Private' : `${room.roomBeds}-bed`}
                  </Tag>
                </div>
              </td>
              {days.map((day) => {
                const guests = getGuestsOnDay(room, day)
                const isToday = formatDate(day) === todayStr
                const bgColor = guests.length > 0
                  ? getCellColor(guests, day)
                  : isToday ? '#1a2a1a' : 'transparent'

                const occupancy = room.roomType === 'private'
                  ? (guests.length > 0 ? '■' : '')
                  : (guests.length > 0 ? `${guests.length}` : '')

                const tooltipText = guests.length > 0
                  ? guests.map((g) => `${g.guestname} (out ${g.departuredate?.split('T')[0]})`).join('\n')
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
                        background: bgColor,
                        minWidth: 44,
                        height: 28,
                        textAlign: 'center',
                        fontSize: 10,
                        color: '#fff',
                        fontWeight: 600,
                      }}
                    >
                      {occupancy}
                    </td>
                  </Tooltip>
                )
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
