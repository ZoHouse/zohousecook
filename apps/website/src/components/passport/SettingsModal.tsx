import React, { useEffect, useState, useMemo, useCallback } from "react";
import GlowCard from "./GlowCard";

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-white/20 border-t-white"
      style={{ width: size, height: size }}
    />
  );
}

function fixAvatarUrl(url?: string): string | undefined {
  if (!url || url.length === 0) return undefined;
  if (url.startsWith("ipfs://")) return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  return url.replace("static.cdn.zo.xyz", "proxy.cdn.zo.xyz");
}

function formatAddress(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2 mt-6 first:mt-0">
      <h3 className="text-[11px] font-medium text-white/40 uppercase tracking-wider">{title}</h3>
      {right}
    </div>
  );
}

type EditableRowType = "text" | "textarea" | "date" | "select";

interface EditableRowProps {
  label: string;
  value: string;
  field: string;
  type?: EditableRowType;
  options?: { value: string; label: string }[];
  disabled?: boolean;
  onSave: (field: string, value: string) => Promise<void>;
  displayValue?: string;
}

function EditableRow({
  label, value, field, type = "text", options, disabled = false, onSave, displayValue,
}: EditableRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(field, draft);
      setEditing(false);
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => { setDraft(value); setError(null); setEditing(false); };

  const shown = displayValue ?? value;

  return (
    <div className="py-3 border-b border-white/5 last:border-b-0">
      <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{label}</p>
      {editing ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-stretch gap-2">
            {type === "textarea" ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") cancel(); }}
                autoFocus
                rows={3}
                className="flex-1 bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/30 resize-y"
              />
            ) : type === "select" ? (
              <select
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
                className="flex-1 bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/30"
              >
                <option value="">Not set</option>
                {options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={type}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); commit(); }
                  if (e.key === "Escape") { e.preventDefault(); cancel(); }
                }}
                autoFocus
                className="flex-1 bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/30"
              />
            )}
            <button
              onClick={commit}
              disabled={saving}
              className="px-3 text-[11px] font-medium bg-white text-black rounded-md hover:bg-white/90 disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? <Spinner size={12} /> : "Save"}
            </button>
            <button
              onClick={cancel}
              disabled={saving}
              className="px-3 text-[11px] text-white/60 hover:text-white"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-white/90 min-w-0 break-words flex-1">
            {shown ? shown : <span className="italic text-white/40">Not set</span>}
          </p>
          {!disabled && (
            <button
              onClick={() => { setDraft(value); setEditing(true); }}
              className="px-2 py-1 text-[10px] text-white/60 hover:text-white border border-white/10 hover:border-white/25 rounded-md transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface ConnectedItemRowProps {
  icon: React.ReactNode;
  iconBg?: string;
  primary: string;
  secondary?: string;
  isPrimary?: boolean;
  verified?: boolean;
  showVerification?: boolean;
  onMakePrimary?: () => void;
  onRemove?: () => void;
}

function ConnectedItemRow({
  icon, iconBg = "bg-white/10", primary, secondary, isPrimary,
  verified, showVerification, onMakePrimary, onRemove,
}: ConnectedItemRowProps) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => { setConfirming(false); }, [primary]);

  return (
    <div className={`group flex items-center gap-3 py-3 border-b border-white/5 last:border-b-0 ${confirming ? "bg-red-500/10 -mx-2 px-2 rounded-md" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90 truncate">{primary}</p>
        {(secondary || showVerification) && (
          <div className="flex items-center gap-2 mt-0.5">
            {showVerification && (
              <span className="flex items-center gap-1 text-[11px]">
                <span className={`w-1.5 h-1.5 rounded-full ${verified ? "bg-green-400" : "bg-amber-400"}`} />
                <span className={verified ? "text-green-400" : "text-amber-400"}>
                  {verified ? "Verified" : "Unverified"}
                </span>
              </span>
            )}
            {secondary && <span className="text-[11px] text-white/50 truncate">{secondary}</span>}
          </div>
        )}
      </div>

      {confirming ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => { onRemove?.(); setConfirming(false); }}
            className="px-2 py-1 text-[11px] bg-red-500 text-white rounded-md hover:bg-red-400"
          >
            Remove
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="px-2 py-1 text-[11px] text-white/60 hover:text-white"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {isPrimary ? (
            <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-green-500/20 text-green-400 rounded-full">
              Primary
            </span>
          ) : (
            onMakePrimary && (
              <button
                onClick={onMakePrimary}
                className="text-[11px] text-white/60 hover:text-white"
              >
                Make primary
              </button>
            )
          )}
          {onRemove && !isPrimary && (
            <button
              onClick={() => setConfirming(true)}
              aria-label="Remove"
              className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 3L3 9M3 3l6 6" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center sm:p-4"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <GlowCard
        className="relative w-full max-w-[640px] h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:rounded-[24px] rounded-none flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <h2 id="settings-modal-title" className="text-lg font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 4L4 12M4 4l8 8" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-sm text-white/40">Sections go here.</p>
        </div>
      </GlowCard>
    </div>
  );
}

export default SettingsModal;
