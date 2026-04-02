import React from "react";
import { GlassCard } from "./GlassCard";

const FEATURES = [
  { icon: "🤝", title: "Affiliate Program", desc: "Share on IG & WhatsApp, earn rewards" },
  { icon: "🌙", title: "Free Nights", desc: "Earn free stays through activity" },
  { icon: "🎭", title: "Community Experiences", desc: "Host and join experiences everywhere" },
  { icon: "🌍", title: "Digital Traveler Community", desc: "Connect with travelers worldwide" },
  { icon: "🏠", title: "Local Friends", desc: "Meet locals, discover hidden gems" },
  { icon: "🎟️", title: "BOGO Deals", desc: "Buy one get one on stays" },
  { icon: "💬", title: "Neighbourhood Chat", desc: "Chat with people around you" },
  { icon: "🎪", title: "Host Experiences", desc: "Create and monetise experiences" },
  { icon: "🏗️", title: "Build Zo World", desc: "List your space as a builder" },
  { icon: "🤖", title: "Trip Partner Agent", desc: "AI-powered trip matching" },
  { icon: "🔑", title: "Early Access", desc: "First access to new features" },
  { icon: "👥", title: "People Around You", desc: "Discover plans and people nearby" },
];

export function ComingSoon() {
  return (
    <GlassCard className="px-4 py-3 flex flex-col">
      <h3 className="text-[11px] font-medium text-dash-text-50 uppercase tracking-wider mb-3">Coming Soon</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-dash-sm border border-dash-border bg-white/5 p-2.5 hover:bg-white/10 hover:border-dash-border-hover transition-colors cursor-default"
          >
            <span className="text-base mb-1.5 block">{f.icon}</span>
            <p className="text-[11px] font-medium text-dash-text mb-0.5">{f.title}</p>
            <p className="text-[9px] text-dash-text-40 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
