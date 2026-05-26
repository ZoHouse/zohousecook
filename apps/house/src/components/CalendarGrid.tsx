import { useMemo, useState } from "react";

import type { CalendarEvent } from "../pages/api/calendar/events";

// Month grid populated with live events from the Luma API. Days are bucketed
// in IST (events happen physically in Bangalore), so the grid is consistent
// for visitors in any timezone. On narrow viewports we hide the grid and
// show a scrollable agenda of upcoming events from the same data.

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const IST_DAY_FMT = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Kolkata",
});
const IST_TIME_FMT = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});
const IST_AGENDA_FMT = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "Asia/Kolkata",
});

function istDayKey(d: Date) {
  return IST_DAY_FMT.format(d);
}
function fmtTime(iso: string) {
  return IST_TIME_FMT.format(new Date(iso));
}
function fmtAgendaDate(iso: string) {
  return IST_AGENDA_FMT.format(new Date(iso));
}
function fmtMonthYear(d: Date) {
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function CalendarGrid({
  events,
  loading = false,
  error = null,
}: {
  events: CalendarEvent[];
  loading?: boolean;
  error?: string | null;
}) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));

  // 6-week grid covering viewMonth, starting on the prior Sunday.
  const cells = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [viewMonth]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const key = istDayKey(new Date(e.start_at));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    for (const list of map.values()) {
      list.sort((a, b) => +new Date(a.start_at) - +new Date(b.start_at));
    }
    return map;
  }, [events]);

  const todayKey = useMemo(() => istDayKey(new Date()), []);

  const upcoming = useMemo(() => {
    const cutoff = Date.now() - 12 * 3600 * 1000; // include events that just started
    return events
      .filter((e) => +new Date(e.start_at) >= cutoff)
      .sort((a, b) => +new Date(a.start_at) - +new Date(b.start_at))
      .slice(0, 25);
  }, [events]);

  return (
    <div className="text-white">
      {/* Month nav */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/10">
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          aria-label="Previous month"
          className="grid place-items-center w-7 h-7 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <p className="font-[family-name:var(--font-headline)] italic text-base text-white">
          {fmtMonthYear(viewMonth)}
        </p>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          aria-label="Next month"
          className="grid place-items-center w-7 h-7 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Desktop / tablet: month grid */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 border-b border-white/5">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="text-[9px] tracking-[2px] uppercase text-white/30 font-mono text-center py-2"
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-6 h-[480px] lg:h-[540px]">
          {cells.map((d, i) => {
            const inMonth = d.getMonth() === viewMonth.getMonth();
            const key = istDayKey(d);
            const dayEvents = eventsByDay.get(key) ?? [];
            const isToday = key === todayKey;
            return (
              <div
                key={i}
                className={`relative flex flex-col border-r border-b border-white/5 last:border-r-0 p-1.5 overflow-hidden ${
                  inMonth ? "" : "opacity-30"
                } ${dayEvents.length > 0 ? "bg-[#c5a572]/[0.05]" : ""}`}
              >
                <div className="flex items-center justify-between gap-1 flex-shrink-0">
                  {isToday ? (
                    <span className="grid place-items-center w-5 h-5 rounded-full bg-[#c5a572] text-black text-[10px] font-mono font-bold leading-none">
                      {d.getDate()}
                    </span>
                  ) : (
                    <p
                      className={`text-[11px] font-mono leading-none ${
                        dayEvents.length > 0
                          ? "text-[#c5a572] font-bold"
                          : "text-white/60"
                      }`}
                    >
                      {d.getDate()}
                    </p>
                  )}
                  {dayEvents.length > 0 && (
                    <span
                      className="flex items-center gap-0.5"
                      aria-label={`${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`}
                    >
                      {Array.from({ length: Math.min(dayEvents.length, 3) }).map(
                        (_, j) => (
                          <span
                            key={j}
                            className="w-1 h-1 rounded-full bg-[#c5a572]"
                          />
                        )
                      )}
                      {dayEvents.length > 3 && (
                        <span className="text-[8px] text-[#c5a572] leading-none ml-0.5">
                          +
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div
                  className="mt-1.5 space-y-0.5 overflow-y-auto flex-1 min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {dayEvents.map((e) => (
                    <a
                      key={e.id}
                      href={e.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${e.name} · ${fmtTime(e.start_at)}`}
                      className="block truncate text-[10px] leading-tight px-1.5 py-0.5 rounded bg-[#c5a572]/20 border border-[#c5a572]/40 text-white hover:bg-[#c5a572]/35 hover:border-[#c5a572] transition-colors"
                    >
                      <span className="font-mono mr-1 text-[#c5a572]">
                        {fmtTime(e.start_at)}
                      </span>
                      {e.name}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: upcoming agenda from the same data */}
      <div className="md:hidden max-h-[60vh] overflow-y-auto px-3 py-3 space-y-2">
        {upcoming.length === 0 ? (
          <p className="text-center text-[11px] text-white/40 py-8">
            No upcoming events.
          </p>
        ) : (
          upcoming.map((e) => (
            <a
              key={e.id}
              href={e.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 border border-white/10 hover:border-[#c5a572]/40 transition-colors"
            >
              <p className="text-[10px] tracking-[2px] uppercase text-[#c5a572] font-mono">
                {fmtAgendaDate(e.start_at)} · {fmtTime(e.start_at)}
              </p>
              <p className="text-sm text-white mt-1 leading-snug">{e.name}</p>
            </a>
          ))
        )}
      </div>

      {loading && (
        <p className="text-center text-[10px] text-white/40 py-3">
          Loading events…
        </p>
      )}
      {error && !loading && (
        <p className="text-center text-[10px] text-red-400 py-3">{error}</p>
      )}
    </div>
  );
}
