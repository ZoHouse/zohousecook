import React, { useState } from "react";
import { useRouter } from "next/router";
import { MetaTags } from "../components/common/MetaTags";
import { HOUSE_MEDIA } from "../config/house-media";

const STAGES = ["Idea", "Prototype", "Launched", "Growing"];
const ROLES = ["Founder", "Engineer", "Designer", "Researcher", "Creator", "Operator"];

export default function Apply() {
  const router = useRouter();
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
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // TODO: wire to Supabase / API
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-4">
            You&apos;re{" "}
            <span className="font-[family-name:var(--font-headline)] italic shiny-gold">in.</span>
          </h1>
          <p className="text-neutral-400 text-lg mb-8">
            We&apos;ll review your application and get back to you soon.
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-neutral-500 hover:text-white transition-colors underline underline-offset-4"
          >
            Back to The Civilisation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <MetaTags
        title="Apply — The Civilisation"
        description="Apply to join India's first permanent hacker house."
      />

      {/* Header */}
      <header className="px-8 md:px-28 py-6 flex justify-between items-center">
        <button
          onClick={() => router.push("/")}
          className="text-xl font-black tracking-tighter font-[family-name:var(--font-headline)] italic shiny-gold"
        >
          Civilisation
        </button>
        <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-500 uppercase">
          Application
        </span>
      </header>

      {/* Full-width banner */}
      <div className="relative w-full h-72 md:h-96 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HOUSE_MEDIA.applyBanner}
          alt="The Civilisation"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-8 md:px-28 pb-10">
          <h1 className="text-3xl md:text-5xl font-medium tracking-tight">
            Claim your{" "}
            <span className="font-[family-name:var(--font-headline)] italic shiny-gold">
              plot.
            </span>
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-24 pt-10">
        <p className="text-neutral-400 text-base md:text-lg mb-12">
          Tell us about yourself and what you&apos;re building. We review every application.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Name */}
          <Field label="Full name" required>
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Your name"
              className="form-input"
            />
          </Field>

          {/* Email */}
          <Field label="Email" required>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@email.com"
              className="form-input"
            />
          </Field>

          {/* Phone */}
          <Field label="Phone / WhatsApp" required>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+91 ..."
              className="form-input"
            />
          </Field>

          {/* City */}
          <Field label="Current city" required>
            <input
              required
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="Bangalore, Mumbai, etc."
              className="form-input"
            />
          </Field>

          {/* Socials */}
          <Field label="LinkedIn / X / Personal website" required>
            <input
              required
              value={form.socials}
              onChange={(e) => update("socials", e.target.value)}
              placeholder="x.com/yourhandle"
              className="form-input"
            />
          </Field>

          {/* Building */}
          <Field label="What are you building right now?" required>
            <textarea
              required
              value={form.building}
              onChange={(e) => update("building", e.target.value)}
              placeholder="Describe your current project..."
              rows={3}
              className="form-input resize-none"
            />
          </Field>

          {/* Problem */}
          <Field label="What problem are you obsessed with?" required>
            <textarea
              required
              value={form.problem}
              onChange={(e) => update("problem", e.target.value)}
              placeholder="The thing that keeps you up at night..."
              rows={3}
              className="form-input resize-none"
            />
          </Field>

          {/* Why join */}
          <Field label="Why do you want to join this cohort?" required>
            <textarea
              required
              value={form.whyJoin}
              onChange={(e) => update("whyJoin", e.target.value)}
              placeholder="What do you hope to get out of living here..."
              rows={3}
              className="form-input resize-none"
            />
          </Field>

          {/* Stage */}
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

          {/* Role */}
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

          {/* How did you hear */}
          <Field label="How did you hear about The Civilisation?">
            <input
              value={form.heardFrom}
              onChange={(e) => update("heardFrom", e.target.value)}
              placeholder="Twitter, friend, event..."
              className="form-input"
            />
          </Field>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !form.stage || !form.role}
            className="w-full bg-white text-black font-bold text-sm tracking-widest uppercase rounded-full py-4 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none mt-4"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>

      <style jsx>{`
        .form-input {
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
        .form-input:focus {
          border-bottom-color: #d4af37;
        }
        .form-input::placeholder {
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
