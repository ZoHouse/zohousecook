import React, { useState, useEffect } from "react";
import { useLiveUpdates, LiveUpdate } from "../../hooks/useLiveUpdates";

function timeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;

  if (diff < 0) {
    const absDiff = Math.abs(diff);
    if (absDiff < 3600000) return `in ${Math.floor(absDiff / 60000)}m`;
    if (absDiff < 86400000) return `in ${Math.floor(absDiff / 3600000)}h`;
    return `in ${Math.floor(absDiff / 86400000)}d`;
  }

  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function formatUpdate(update: LiveUpdate): string {
  if (update.type === "checkin") {
    return `${update.nickname} checked in at ${update.location}`;
  }
  if (update.type === "checkout") {
    return `${update.nickname} checked out from ${update.location}`;
  }
  return `${update.nickname}${update.location ? ` at ${update.location}` : ""}`;
}

export function LiveUpdatesPill() {
  const { updates } = useLiveUpdates();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Rotate through updates every 4 seconds
  useEffect(() => {
    if (updates.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % Math.min(updates.length, 10));
    }, 4000);
    return () => clearInterval(interval);
  }, [updates.length]);

  if (updates.length === 0) return null;

  const current = updates[currentIndex];
  if (!current) return null;

  const dotColor =
    current.type === "checkin"
      ? "bg-green-400"
      : current.type === "checkout"
        ? "bg-orange-400"
        : "bg-purple-400";

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 max-w-[480px]">
      <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse flex-shrink-0`} />
      <p className="text-xs text-white/80 truncate">
        {formatUpdate(current)}
      </p>
      <span className="text-[10px] text-white/40 flex-shrink-0">
        {timeAgo(current.timestamp)}
      </span>
    </div>
  );
}
