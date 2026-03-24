import React, { useState } from "react";
import { GlassCard } from "./GlassCard";
import { useLiveUpdates, UpdateType, LiveUpdate } from "../../hooks/useLiveUpdates";

function timeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;

  if (diff < 0) {
    // Future event
    const absDiff = Math.abs(diff);
    if (absDiff < 3600000) return `in ${Math.floor(absDiff / 60000)}m`;
    if (absDiff < 86400000) return `in ${Math.floor(absDiff / 3600000)}h`;
    return `in ${Math.floor(absDiff / 86400000)}d`;
  }

  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function UpdateIcon({ type }: { type: UpdateType }) {
  if (type === "checkin") {
    return (
      <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      </div>
    );
  }
  if (type === "checkout") {
    return (
      <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </div>
    );
  }
  // rsvp
  return (
    <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;

  const colors: Record<string, string> = {
    "checked-in": "bg-green-500/20 text-green-400",
    "checked-out": "bg-orange-500/20 text-orange-400",
    confirmed: "bg-blue-500/20 text-blue-400",
    requested: "bg-yellow-500/20 text-yellow-400",
    cancelled: "bg-red-500/20 text-red-400",
    pending: "bg-gray-500/20 text-gray-400",
  };

  const label = status.replace(/-/g, " ");
  const colorClass = colors[status] || "bg-gray-500/20 text-gray-400";

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${colorClass}`}>
      {label}
    </span>
  );
}

function UpdateRow({ update }: { update: LiveUpdate }) {
  const getMessage = () => {
    if (update.type === "checkin") {
      return (
        <>
          <span className="text-dash-text font-medium">{update.nickname}</span>
          <span className="text-dash-text-50"> checked in at </span>
          <span className="text-dash-text-80">{update.location}</span>
        </>
      );
    }
    if (update.type === "checkout") {
      return (
        <>
          <span className="text-dash-text font-medium">{update.nickname}</span>
          <span className="text-dash-text-50"> checked out from </span>
          <span className="text-dash-text-80">{update.location}</span>
        </>
      );
    }
    // rsvp
    return (
      <>
        <span className="text-dash-text font-medium">{update.nickname}</span>
        {update.location && (
          <>
            <span className="text-dash-text-50"> at </span>
            <span className="text-dash-text-80">{update.location}</span>
          </>
        )}
      </>
    );
  };

  return (
    <div className="flex items-start gap-dash-md py-2 group">
      <UpdateIcon type={update.type} />
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-relaxed truncate">
          {getMessage()}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-dash-text-40">{timeAgo(update.timestamp)}</span>
          <StatusBadge status={update.status} />
        </div>
      </div>
      {update.avatar && (
        <img
          src={update.avatar}
          alt=""
          className="w-6 h-6 rounded-full object-cover flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}

type FilterType = "all" | "checkin" | "rsvp";

export function LiveUpdates() {
  const { updates, isLoading } = useLiveUpdates();
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = filter === "all"
    ? updates
    : filter === "checkin"
      ? updates.filter((u) => u.type === "checkin" || u.type === "checkout")
      : updates.filter((u) => u.type === "rsvp");

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "checkin", label: "Visits" },
    { key: "rsvp", label: "Events" },
  ];

  return (
    <GlassCard className="p-dash-xl flex flex-col h-[384px]">
      <div className="flex items-center justify-between mb-dash-lg">
        <h3 className="text-sm font-medium text-dash-text-50 uppercase tracking-wider">
          Live Updates
        </h3>
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                filter === f.key
                  ? "bg-dash-accent/20 text-dash-accent"
                  : "text-dash-text-40 hover:text-dash-text-80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dash-text-50" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-dash-text-40 text-sm">
            <p>No updates yet</p>
          </div>
        ) : (
          <div className="divide-y divide-dash-border/30">
            {filtered.slice(0, 30).map((update) => (
              <UpdateRow key={update.id} update={update} />
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
