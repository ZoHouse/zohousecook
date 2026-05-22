import React, { useEffect, useMemo, useState } from "react";
import { useZoAuth } from "../hooks/useZoAuth";
import { HOUSE_MEDIA } from "../config/house-media";
import { track } from "../lib/analytics/track";
import {
  VirtualTicket,
  parseHandleFromSocials,
  pickTitle,
} from "./VirtualTicket";

const STAGES = ["Idea", "Prototype", "Launched", "Growing"];
const ROLES = ["Founder", "Engineer", "Designer", "Researcher", "Creator", "Operator"];
const PROPERTIES: { value: string; label: string; sub: string }[] = [
  { value: "WTFxZo", label: "WTFxZo", sub: "Whitefield · 20 slots" },
  { value: "BLRxZo", label: "BLRxZo", sub: "Koramangala · 15 slots" },
  { value: "Either", label: "Either", sub: "Open to both" },
];

interface ApplyModalProps {
  open: boolean;
  onClose: () => void;
}

export function ApplyModal({ open, onClose }: ApplyModalProps) {
  const { user } = useZoAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    socials: "",
    building: "",
    problem: "",
    whyJoin: "",
    stage: "",
    heardFrom: "",
    role: "",
    preferredProperty: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [waitlistNumber, setWaitlistNumber] = useState<number | null>(null);
  const [shareSlug, setShareSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
    setForm((prev) => ({
      ...prev,
      name: prev.name || fullName || user.nickname || "",
      email: prev.email || user.email || "",
      phone:
        prev.phone ||
        (user.mobile_country_code && user.mobile_number
          ? `+${user.mobile_country_code} ${user.mobile_number}`
          : ""),
    }));
  }, [user]);

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    track("apply_submit_attempt");
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("zo-house-token")
          : null;
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorCode = data?.error || `http_${res.status}`;
        track("apply_submit_error", { error_code: errorCode });
        setSubmitError(data?.error || `Submit failed (${res.status})`);
        return;
      }
      // apply_submit_success is fired by the API route (Chunk 4). no client fire here.
      if (typeof data?.waitlist_number === "number") {
        setWaitlistNumber(data.waitlist_number);
      }
      if (typeof data?.share_slug === "string") {
        setShareSlug(data.share_slug);
      }
      setSubmitted(true);
    } catch (err) {
      track("apply_submit_error", { error_code: "network" });
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9998] bg-black/90 backdrop-blur-md overflow-y-auto"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed top-6 right-6 z-[10] w-10 h-10 flex items-center justify-center rounded-full text-neutral-400 hover:text-white bg-black/60 border border-white/10 hover:border-white/30 transition-colors text-xl"
      >
        ×
      </button>

      <div className="min-h-screen w-full flex flex-col items-center py-16 md:py-24 px-4 md:px-8">
        <div className="w-full max-w-2xl">
          {submitted ? (
            <SubmittedTicket
              form={form}
              waitlistNumber={waitlistNumber}
              shareSlug={shareSlug}
              onClose={onClose}
            />
          ) : (
            <>
              {/* Banner */}
              <div className="relative w-full h-56 md:h-72 rounded-2xl overflow-hidden mb-10 border border-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={HOUSE_MEDIA.applyBanner}
                  alt="Zo House"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#d4af37] mb-1">
                    Zo House · Application
                  </p>
                  <h1 className="text-2xl md:text-4xl font-medium tracking-tight text-white">
                    Claim your{" "}
                    <span className="font-[family-name:var(--font-headline)] italic shiny-gold">
                      slot.
                    </span>
                  </h1>
                </div>
              </div>

              <p className="text-neutral-400 text-base md:text-lg mb-10 px-1">
                Tell us about yourself and what you&apos;re building. We review every application.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-7 px-1">
                <Field label="Full name" required>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    onFocus={() => track("apply_field_focus", { field: "name" })}
                    onBlur={(e) => track("apply_field_blur", { field: "name", was_filled: !!e.target.value.trim() })}
                    placeholder="Your name"
                    className="apply-input"
                  />
                </Field>

                <Field label="Email" required>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    onFocus={() => track("apply_field_focus", { field: "email" })}
                    onBlur={(e) => track("apply_field_blur", { field: "email", was_filled: !!e.target.value.trim() })}
                    placeholder="you@email.com"
                    className="apply-input"
                  />
                </Field>

                <Field label="Phone / WhatsApp" required>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    onFocus={() => track("apply_field_focus", { field: "phone" })}
                    onBlur={(e) => track("apply_field_blur", { field: "phone", was_filled: !!e.target.value.trim() })}
                    placeholder="+91 ..."
                    className="apply-input"
                  />
                </Field>

                <BlurGate
                  locked={
                    !form.name.trim() ||
                    !form.email.trim() ||
                    !form.phone.trim()
                  }
                >
                <Field label="Current city" required>
                  <input
                    required
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    onFocus={() => track("apply_field_focus", { field: "city" })}
                    onBlur={(e) => track("apply_field_blur", { field: "city", was_filled: !!e.target.value.trim() })}
                    placeholder="Bangalore, Mumbai, etc."
                    className="apply-input"
                  />
                </Field>

                <Field label="LinkedIn, X or GitHub" required>
                  <input
                    required
                    value={form.socials}
                    onChange={(e) => update("socials", e.target.value)}
                    onFocus={() => track("apply_field_focus", { field: "socials" })}
                    onBlur={(e) => track("apply_field_blur", { field: "socials", was_filled: !!e.target.value.trim() })}
                    placeholder="linkedin.com/in/you · x.com/you · github.com/you"
                    className="apply-input"
                  />
                </Field>

                <Field label="What are you building right now?" required>
                  <textarea
                    required
                    value={form.building}
                    onChange={(e) => update("building", e.target.value)}
                    onFocus={() => track("apply_field_focus", { field: "building" })}
                    onBlur={(e) => track("apply_field_blur", { field: "building", was_filled: !!e.target.value.trim() })}
                    placeholder="Describe your current project..."
                    rows={3}
                    className="apply-input resize-none"
                  />
                </Field>

                <Field label="What problem are you obsessed with?" required>
                  <textarea
                    required
                    value={form.problem}
                    onChange={(e) => update("problem", e.target.value)}
                    onFocus={() => track("apply_field_focus", { field: "problem" })}
                    onBlur={(e) => track("apply_field_blur", { field: "problem", was_filled: !!e.target.value.trim() })}
                    placeholder="The thing that keeps you up at night..."
                    rows={3}
                    className="apply-input resize-none"
                  />
                </Field>

                <Field label="Why do you want to join this cohort?" required>
                  <textarea
                    required
                    value={form.whyJoin}
                    onChange={(e) => update("whyJoin", e.target.value)}
                    onFocus={() => track("apply_field_focus", { field: "whyJoin" })}
                    onBlur={(e) => track("apply_field_blur", { field: "whyJoin", was_filled: !!e.target.value.trim() })}
                    placeholder="What do you hope to get out of living here..."
                    rows={3}
                    className="apply-input resize-none"
                  />
                </Field>

                <Field label="What stage are you at?" required>
                  <div className="flex flex-wrap gap-2">
                    {STAGES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => update("stage", s)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                          form.stage === s
                            ? "border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10"
                            : "border-white/10 text-neutral-400 hover:border-white/30"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Applying as" required>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => update("role", r)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                          form.role === r
                            ? "border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10"
                            : "border-white/10 text-neutral-400 hover:border-white/30"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Preferred node" required>
                  <div className="flex flex-wrap gap-2">
                    {PROPERTIES.map((p) => {
                      const selected = form.preferredProperty === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => update("preferredProperty", p.value)}
                          className={`px-4 py-3 rounded-2xl text-sm font-medium border text-left transition-all ${
                            selected
                              ? "border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10"
                              : "border-white/10 text-neutral-400 hover:border-white/30"
                          }`}
                        >
                          <div className="font-bold tracking-tight">{p.label}</div>
                          <div className="text-[10px] tracking-[0.15em] uppercase opacity-70 mt-0.5">
                            {p.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="How did you hear about Zo House?">
                  <input
                    value={form.heardFrom}
                    onChange={(e) => update("heardFrom", e.target.value)}
                    onFocus={() => track("apply_field_focus", { field: "heardFrom" })}
                    onBlur={(e) => track("apply_field_blur", { field: "heardFrom", was_filled: !!e.target.value.trim() })}
                    placeholder="Twitter, friend, event..."
                    className="apply-input"
                  />
                </Field>

                {submitError && (
                  <p className="text-red-400 text-xs">{submitError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !form.stage || !form.role || !form.preferredProperty}
                  className="w-full bg-white text-black font-bold text-sm tracking-widest uppercase rounded-full py-4 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none mt-2"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
                </BlurGate>
              </form>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .apply-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          padding: 12px 0;
          color: white;
          font-size: 16px;
          outline: none;
          transition: border-color 0.3s;
        }
        .apply-input:focus {
          border-bottom-color: #d4af37;
        }
        .apply-input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold tracking-[0.2em] text-neutral-500 uppercase mb-2 block">
        {label}
        {required && <span className="text-[#d4af37] ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function BlurGate({
  locked,
  children,
}: {
  locked: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div
        className="flex flex-col gap-7 transition-[filter,opacity] duration-500"
        style={{
          filter: locked ? "blur(8px)" : "none",
          opacity: locked ? 0.5 : 1,
          pointerEvents: locked ? "none" : "auto",
          userSelect: locked ? "none" : "auto",
        }}
        aria-hidden={locked}
      >
        {children}
      </div>
      {locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-start pt-16 text-center px-6 pointer-events-none">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#d4af37] mb-2">
            Locked
          </p>
          <p className="text-white text-base md:text-lg font-medium tracking-tight max-w-xs">
            Fill your name, email and phone to continue.
          </p>
        </div>
      )}
    </div>
  );
}

function SubmittedTicket({
  form,
  waitlistNumber,
  shareSlug,
  onClose,
}: {
  form: { name: string; socials: string; email: string };
  waitlistNumber: number | null;
  shareSlug: string | null;
  onClose: () => void;
}) {
  const handle = useMemo(
    () => parseHandleFromSocials(form.socials, form.name),
    [form.socials, form.name]
  );
  const title = useMemo(
    () => pickTitle(form.email || form.name || handle),
    [form.email, form.name, handle]
  );
  const ticketNo = useMemo(() => {
    if (typeof waitlistNumber === "number" && waitlistNumber > 0) {
      return String(waitlistNumber).padStart(6, "0");
    }
    // Fallback when the count query failed. keep a stable per-applicant code
    // so the ticket still renders something.
    const seed = `${form.email}${form.name}${handle}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 33 + seed.charCodeAt(i)) >>> 0;
    }
    return String(hash % 1_000_000).padStart(6, "0");
  }, [waitlistNumber, form.email, form.name, handle]);

  return (
    <div className="text-center py-8 md:py-12">
      <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#d4af37] mb-4">
        Zo House
      </p>
      <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-3 text-white">
        You&apos;re{" "}
        <span className="font-[family-name:var(--font-headline)] italic shiny-gold">
          waitlisted.
        </span>
      </h2>
      <p className="text-neutral-400 text-base md:text-lg mb-8">
        Your waitlist pass. Share it, see you soon.
      </p>
      <div className="flex justify-center">
        <div className="origin-top sm:scale-[0.78]">
          <VirtualTicket
            name={form.name || "Zo Citizen"}
            handle={handle}
            title={title}
            ticketNo={ticketNo}
            socials={form.socials}
            shareSlug={shareSlug}
          />
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-sm text-neutral-500 hover:text-white transition-colors underline underline-offset-4 mt-4"
      >
        Back to Zo House
      </button>
    </div>
  );
}
