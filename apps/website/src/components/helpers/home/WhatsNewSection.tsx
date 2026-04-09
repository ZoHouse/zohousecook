"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Marquee from "react-fast-marquee";
import { useFadeInOnScroll } from "../../../hooks";
import { syneClassName, rubikClassName } from "../../utils/font";
import { cn } from "@zo/utils/font";
import EventCard from "./EventCard";
import { useJourney } from "../../journey/JourneyContext";
// Illustrations must be JS imports (NX monorepo: public/ assets 404 on Vercel)
import travellerIllustration from "../../../assets/tiers/traveller-illustration.png";
import creatorIllustration from "../../../assets/tiers/creator-illustration.png";
import vibetribeIllustration from "../../../assets/tiers/vibetribe-illustration.png";

/* ── TiltCard (ported from zo-passport) ── */

function TiltCard({
  children,
  className = "",
  glowColor = "rgba(149, 13, 255, 0.3)",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [6, -6]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-6, 6]), { stiffness: 200, damping: 30 });
  const glowX = useSpring(useTransform(x, [0, 1], [0, 100]), { stiffness: 200, damping: 30 });
  const glowY = useSpring(useTransform(y, [0, 1], [0, 100]), { stiffness: 200, damping: 30 });

  const glowOpacity = useTransform([x, y], ([xv, yv]) => {
    const dist = Math.sqrt((xv as number - 0.5) ** 2 + (yv as number - 0.5) ** 2);
    return Math.min(dist * 3, 1);
  });

  const updatePosition = (clientX: number, clientY: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((clientX - rect.left) / rect.width);
    y.set((clientY - rect.top) / rect.height);
  };

  const resetPosition = () => { x.set(0.5); y.set(0.5); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => updatePosition(e.clientX, e.clientY)}
      onMouseLeave={resetPosition}
      onTouchMove={(e) => { const t = e.touches[0]; if (t) updatePosition(t.clientX, t.clientY); }}
      onTouchEnd={resetPosition}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 800,
        transformStyle: "preserve-3d",
      }}
      className={`relative cursor-pointer ${className}`}
    >
      {children}
      <motion.div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          opacity: glowOpacity,
          background: useTransform(
            [glowX, glowY],
            ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, ${glowColor}, transparent 60%)`
          ),
        }}
      />
    </motion.div>
  );
}

/* ── SVG Icons matching Figma ── */

const TravellerIcon = () => (
  <div
    className="w-[80px] h-[80px] flex items-center justify-center rounded-[16px]"
    style={{ background: "linear-gradient(135.38deg, #FFB68F 3.44%, #F66409 98.45%)" }}
  >
    <div className="flex flex-row items-start gap-0">
      <div className="w-[19px] h-[48px] rounded-[2px]" style={{ background: "linear-gradient(161.08deg, #E28539 5.06%, #A44D01 66.51%)" }} />
      <div className="w-[19px] h-[48px] rounded-[2px] -scale-x-100" style={{ background: "linear-gradient(136.97deg, #E18710 31.79%, #8B4414 68.7%)" }} />
      <div className="w-[19px] h-[48px] rounded-[2px]" style={{ background: "linear-gradient(161.44deg, #B9481F 5.1%, #B35F10 85.46%)" }} />
    </div>
  </div>
);

const CreatorIcon = () => (
  <div
    className="w-[80px] h-[80px] flex items-center justify-center rounded-[16px]"
    style={{ background: "linear-gradient(135.38deg, #E7C7FF 3.44%, #6000AA 98.45%)" }}
  >
    <svg width="56" height="56" viewBox="0 0 47 47" fill="none">
      <path d="M23.5 0L29.5 17.5H47L33 29L38.5 47L23.5 35.5L8.5 47L14 29L0 17.5H17.5L23.5 0Z" fill="url(#creator-grad)" />
      <defs>
        <linearGradient id="creator-grad" x1="0" y1="0" x2="47" y2="47" gradientUnits="userSpaceOnUse">
          <stop offset="0.3179" stopColor="#950DFF" />
          <stop offset="0.687" stopColor="#590899" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const TribebuilderIcon = () => (
  <div
    className="w-[80px] h-[80px] flex items-center justify-center rounded-[16px]"
    style={{ background: "linear-gradient(135.38deg, #FFC7DD 3.44%, #AA0036 98.45%)" }}
  >
    <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
      <path d="M24 2L44 14V34L24 46L4 34V14L24 2Z" fill="url(#tribe-grad)" />
      <defs>
        <linearGradient id="tribe-grad" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0.3179" stopColor="#FF0D56" />
          <stop offset="0.687" stopColor="#99083B" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const HostIcon = () => (
  <div
    className="w-[80px] h-[80px] flex items-center justify-center rounded-[16px]"
    style={{ background: "linear-gradient(135.38deg, #CEFFF9 3.44%, #00AA61 98.45%)" }}
  >
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <path d="M28 2L34.5 20.5H54L38.5 32L44 52L28 40L12 52L17.5 32L2 20.5H21.5L28 2Z" fill="url(#host-grad)" />
      <defs>
        <linearGradient id="host-grad" x1="2" y1="2" x2="54" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0.3179" stopColor="#0E825A" />
          <stop offset="0.687" stopColor="#08995A" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const BuildIcon = () => (
  <div
    className="w-[80px] h-[80px] flex items-center justify-center rounded-[16px]"
    style={{ background: "linear-gradient(135.38deg, #FFD6D6 3.44%, #AA0000 98.45%)" }}
  >
    <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="8" width="32" height="32" rx="4" fill="url(#build-grad)" />
      <rect x="14" y="20" width="8" height="12" rx="1" fill="rgba(255,255,255,0.3)" />
      <rect x="26" y="14" width="8" height="18" rx="1" fill="rgba(255,255,255,0.3)" />
      <defs>
        <linearGradient id="build-grad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0.3179" stopColor="#FF3B3B" />
          <stop offset="0.687" stopColor="#990000" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

/* ── Perk item ── */

interface Perk {
  text: string;
  pro?: boolean;
}

function PerkItem({ text, pro, color }: Perk & { color: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className={cn("text-xs leading-[18px]", rubikClassName, pro ? "text-white/90" : "text-white/70")}>
        {text}
        {pro && (
          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-500/20 text-purple-300 align-middle">
            Pro
          </span>
        )}
      </span>
    </div>
  );
}

/* ── Card config ── */

interface RoleCard {
  title: string;
  tagline: string;
  subtitle: string;
  taglineColor: string;
  glowColor: string;
  comingSoon?: boolean;
  icon: React.ReactNode;
  illustration?: { src: string } | string;
  perks: Perk[];
  cta?: { label: string; href: string };
}

const roles: RoleCard[] = [
  {
    title: "Travel",
    subtitle: "Go further with the community",
    tagline: "Travel like a pro",
    taglineColor: "#F87B2F",
    glowColor: "#FDAA7B",
    icon: <TravellerIcon />,
    illustration: travellerIllustration,
    perks: [
      { text: "Buy 1 Get 1 Free nights every month", pro: true },
      { text: "Access Zostel common areas", pro: true },
      { text: "Discover hosted experiences around you", pro: true },
      { text: "Join city chats with residents, hosts, and travellers", pro: true },
      { text: "Get early access across Zo properties", pro: true },
      { text: "Plan trips with Zobu, your travel partner agent", pro: true },
    ],
  },
  {
    title: "Create",
    subtitle: "Monetize and get rewarded for your content",
    tagline: "Turn travel stories into income",
    taglineColor: "#B85DFF",
    glowColor: "linear-gradient(180deg, #950DFF 18.27%, rgba(212, 156, 255, 0.3) 52.88%)",
    icon: <CreatorIcon />,
    illustration: creatorIllustration,
    perks: [
      { text: "Join daily Instagram quests" },
      { text: "Unlock Daily ₹7k Creator Bed Drops and Zo Credits" },
      { text: "Monetize views on your Instagram content", pro: true },
    ],
  },
  {
    title: "Vibetribe",
    subtitle: "Build your network and earn together",
    tagline: "Grow the tribe, earn commission",
    taglineColor: "#FF0D55",
    glowColor: "#CE0A48",
    icon: <TribebuilderIcon />,
    illustration: vibetribeIllustration,
    perks: [
      { text: "Invite others to join using your link, earn 7% on their first booking" },
      { text: "Earn 7% commission on bookings made through your link for 1 year", pro: true },
      { text: "Invitees get 5% off on their first booking" },
    ],
    cta: { label: "Invite", href: "/passport" },
  },
  {
    title: "Host",
    subtitle: "Turn what you love into experiences people join",
    tagline: "Bring people together",
    taglineColor: "#29BB7F",
    glowColor: "#1CB675",
    comingSoon: true,
    icon: <HostIcon />,
    perks: [
      { text: "Access tools to host community experiences", pro: true },
      { text: "Host meetups, food walks, workshops, dinners, and cultural moments", pro: true },
      { text: "Turn your local knowledge, vibe, or passion into experiences others discover and join", pro: true },
      { text: "Earn by creating the moments that bring the community together", pro: true },
    ],
  },
  {
    title: "Build",
    subtitle: "Open up your space. Build Zo World.",
    tagline: "Open doors for the community",
    taglineColor: "#FF3B3B",
    glowColor: "#CC2222",
    comingSoon: true,
    icon: <BuildIcon />,
    perks: [
      { text: "List your space for community events", pro: true },
      { text: "Earn by creating spaces where people connect, host, and belong", pro: true },
    ],
  },
];

/* ── VibeCard — replaces static PNGs with real UI ── */

function VibeCard({ role, className = "" }: { role: RoleCard; className?: string }) {
  const glowColor = role.glowColor.startsWith("linear")
    ? role.glowColor
    : role.glowColor;

  return (
    <TiltCard
      glowColor={role.glowColor.startsWith("linear") ? "rgba(149, 13, 255, 0.25)" : `${role.glowColor}44`}
      className={cn("rounded-2xl", className)}
    >
      <div
        className="relative flex flex-col justify-between overflow-hidden rounded-2xl h-full border border-white/[0.12]"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
          boxShadow: "inset 0px 1px 1px rgba(255, 255, 255, 0.15), 0px 4px 24px rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
        }}
      >
        {/* Color glow */}
        <div
          className="absolute w-[140px] h-[140px] -left-4 -top-4 pointer-events-none opacity-70"
          style={{ background: glowColor, filter: "blur(60px)", zIndex: 0 }}
        />

        {/* Header: icon + title */}
        <div className="relative z-10 flex items-center gap-3 p-4 pb-0">
          <div className="flex-shrink-0 origin-top-left scale-50 w-10 h-10">
            {role.icon}
          </div>
          <h3 className={cn("text-lg font-semibold text-white", syneClassName)}>
            {role.title}
          </h3>
        </div>

        {/* Coming Soon badge */}
        {role.comingSoon && (
          <div className="relative z-10 px-4 mt-1 flex-shrink-0">
            <span
              className={cn("text-[10px] px-2 py-0.5 rounded-full", rubikClassName)}
              style={{ background: "#2B3228", color: "#54B835" }}
            >
              Coming Soon
            </span>
          </div>
        )}

        {/* 3D illustration (only for Travel, Create, VibeTribe) */}
        {role.illustration && (
          <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={typeof role.illustration === "string" ? role.illustration : role.illustration?.src}
              alt=""
              className="w-[60%] max-w-[180px] h-auto object-contain drop-shadow-2xl"
            />
          </div>
        )}

        {/* Spacer pushes tagline to bottom on short cards */}
        {!role.illustration && <div className="flex-1" />}

        {/* Tagline */}
        <p
          className={cn(
            "relative z-10 text-sm font-medium leading-snug px-4 pb-3 pt-1 flex-shrink-0",
            rubikClassName
          )}
          style={{ color: role.taglineColor }}
        >
          {role.tagline}
        </p>
      </div>
    </TiltCard>
  );
}

/* ── Small icons for Pro Passport perks ── */

const SmallTravellerIcon = () => (
  <div className="w-8 h-8 flex items-center justify-center rounded-[6.4px] flex-shrink-0" style={{ background: "linear-gradient(135.38deg, #FFB68F 3.44%, #F66409 98.45%)" }}>
    <div className="flex flex-row items-start gap-0">
      <div className="w-[6.5px] h-[16px] rounded-[0.7px]" style={{ background: "linear-gradient(161.08deg, #E28539 5.06%, #A44D01 66.51%)" }} />
      <div className="w-[6.5px] h-[16px] rounded-[0.7px] -scale-x-100" style={{ background: "linear-gradient(136.97deg, #E18710 31.79%, #8B4414 68.7%)" }} />
      <div className="w-[6.5px] h-[16px] rounded-[0.7px]" style={{ background: "linear-gradient(161.44deg, #B9481F 5.1%, #B35F10 85.46%)" }} />
    </div>
  </div>
);

const SmallCreatorIcon = () => (
  <div className="w-8 h-8 flex items-center justify-center rounded-[6.4px] flex-shrink-0" style={{ background: "linear-gradient(135.38deg, #E7C7FF 3.44%, #6000AA 98.45%)" }}>
    <svg width="24" height="24" viewBox="0 0 47 47" fill="none">
      <path d="M23.5 0L29.5 17.5H47L33 29L38.5 47L23.5 35.5L8.5 47L14 29L0 17.5H17.5L23.5 0Z" fill="url(#creator-grad-sm)" />
      <defs>
        <linearGradient id="creator-grad-sm" x1="0" y1="0" x2="47" y2="47" gradientUnits="userSpaceOnUse">
          <stop offset="0.3179" stopColor="#950DFF" />
          <stop offset="0.687" stopColor="#590899" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const SmallTribebuilderIcon = () => (
  <div className="w-8 h-8 flex items-center justify-center rounded-[6.4px] flex-shrink-0" style={{ background: "linear-gradient(135.38deg, #FFC7DD 3.44%, #AA0036 98.45%)" }}>
    <svg width="19" height="19" viewBox="0 0 48 48" fill="none">
      <path d="M24 2L44 14V34L24 46L4 34V14L24 2Z" fill="url(#tribe-grad-sm)" />
      <defs>
        <linearGradient id="tribe-grad-sm" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0.3179" stopColor="#FF0D56" />
          <stop offset="0.687" stopColor="#99083B" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const TickIcon = () => (
  <div className="w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0" style={{ background: "#322832" }}>
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
      <path d="M1 5L4.5 8.5L11 1.5" stroke="url(#tick-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="tick-grad" x1="1" y1="5" x2="11" y2="1.5" gradientUnits="userSpaceOnUse">
          <stop offset="0.3155" stopColor="#950DFF" />
          <stop offset="1.6869" stopColor="#590899" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

/* ── Pro Passport perks ── */

const proPerks = [
  {
    section: "Travel Perks",
    icon: <SmallTravellerIcon />,
    items: [
      "Buy 1 Get 1 Free nights every month",
      "Access Zostel common areas",
      "Get early access across Zo properties",
    ],
  },
  {
    section: "Creator Perks",
    icon: <SmallCreatorIcon />,
    items: [
      "Monetize views on your Instagram content",
      "Unlock Daily ₹7k Creator Bed Drops",
    ],
  },
  {
    section: "Tribebuilder Perks",
    icon: <SmallTribebuilderIcon />,
    items: [
      "Earn 7% commission for 1 year",
    ],
  },
];

/* ── Role Modal ── */

function RoleModal({ role, onClose }: { role: RoleCard; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Modal card with TiltCard effect */}
      <TiltCard
        glowColor={role.glowColor.startsWith("linear") ? "rgba(149, 13, 255, 0.4)" : role.glowColor + "66"}
        className="relative z-10 w-full max-w-[480px]"
      >
        <motion.div
          className="relative flex flex-col items-start p-8 gap-5 overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #292929 -14.43%, #000000 116.42%)",
            boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.5), inset 0px 1.93px 7.71px rgba(255, 255, 255, 0.25)",
            backdropFilter: "blur(48px)",
            borderRadius: "24px",
          }}
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
        >
          {/* Glow */}
          <div
            className="absolute w-[200px] h-[200px] -left-12 -top-12 pointer-events-none"
            style={{ background: role.glowColor, filter: "blur(100px)", zIndex: 0 }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Header */}
          <div className="relative z-10 flex items-start gap-4">
            {role.icon}
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h3 className={cn("text-2xl md:text-3xl font-semibold text-white", syneClassName)}>
                  {role.title}
                </h3>
                {role.comingSoon && (
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap", rubikClassName)} style={{ background: "#2B3228", color: "#54B835" }}>
                    Coming Soon
                  </span>
                )}
              </div>
              <p className={cn("text-sm leading-[24px] mt-1", rubikClassName)} style={{ color: role.taglineColor }}>
                {role.subtitle}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="relative z-10 w-full h-px" style={{ background: `linear-gradient(90deg, transparent, ${role.taglineColor}44, transparent)` }} />

          {/* Perks */}
          <div className="relative z-10 flex flex-col gap-2.5 w-full">
            {role.perks.map((perk, i) => (
              <PerkItem key={i} {...perk} color={role.taglineColor} />
            ))}
          </div>

          {/* CTA */}
          {role.cta && (
            <a
              href={role.cta.href}
              className={cn("relative z-10 self-start px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90", rubikClassName)}
              style={{ background: role.taglineColor }}
            >
              {role.cta.label}
            </a>
          )}
        </motion.div>
      </TiltCard>
    </motion.div>
  );
}

/* ── Component ── */

const WhatsNewSection: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();
  const { startJourney } = useJourney();

  return (
    <div
      className="relative z-20 px-6 lg:px-16 max-w-[1600px] mx-auto"
      ref={sectionRef}
    >
      <EventCard />

      {/* ── Vibe Cards — horizontal scroll on mobile, Host+Build stacked ── */}
      <div className="flex xl:hidden gap-3 mt-10 overflow-x-auto pb-4 -mx-6 px-6 snap-x scroll-smooth hide-scrollbar">
        {roles.slice(0, 3).map((role) => (
          <button
            key={role.title}
            onClick={() => startJourney(role.title)}
            className="flex-shrink-0 snap-start"
          >
            <VibeCard role={role} className="h-[280px] w-[200px]" />
          </button>
        ))}
        {/* Host + Build stacked as one scroll item */}
        <div className="flex-shrink-0 snap-start flex flex-col gap-3 w-[200px]">
          <button onClick={() => startJourney(roles[3].title)}>
            <VibeCard role={roles[3]} className="h-[134px] w-[200px]" />
          </button>
          <button onClick={() => startJourney(roles[4].title)}>
            <VibeCard role={roles[4]} className="h-[134px] w-[200px]" />
          </button>
        </div>
      </div>

      {/* Desktop: asymmetric grid — 3 tall + 2 stacked */}
      <div className="hidden xl:grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 mt-10">
        {roles.slice(0, 3).map((role) => (
          <button key={role.title} onClick={() => startJourney(role.title)} className="cursor-pointer hover:scale-[1.02] transition-transform">
            <VibeCard role={role} className="h-full" />
          </button>
        ))}
        {/* Host + Build stacked */}
        <div className="flex flex-col gap-4">
          <button onClick={() => startJourney(roles[3].title)} className="flex-1 cursor-pointer hover:scale-[1.02] transition-transform">
            <VibeCard role={roles[3]} className="h-full" />
          </button>
          <button onClick={() => startJourney(roles[4].title)} className="flex-1 cursor-pointer hover:scale-[1.02] transition-transform">
            <VibeCard role={roles[4]} className="h-full" />
          </button>
        </div>
      </div>

      {/* ── Plans Section ── */}
      <div className="flex flex-col items-center mt-20 gap-6">
        <div className="flex flex-col items-center gap-4 max-w-[808px] text-center">
          <h2 className={cn("text-3xl md:text-[56px] md:leading-[67px] font-semibold text-white", syneClassName)}>
            All citizens can participate and earn.
          </h2>
          <p className={cn("text-lg md:text-xl leading-[30px] text-white", rubikClassName)}>
            Pro citizens unlock the full travel perks and earning stack.
          </p>
        </div>

        {/* Pro Passport Card */}
        <div
          className="relative w-full max-w-[808px] flex flex-col p-6 gap-4 overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #292929 -14.43%, #000000 116.42%)",
            boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.25), inset 0px 1.93px 7.71px rgba(255, 255, 255, 0.25)",
            backdropFilter: "blur(48px)",
            borderRadius: "24px",
          }}
        >
          {/* Glow */}
          <div
            className="absolute w-[159px] h-[159px] -left-9 -top-9 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, #FFAE0D 18.27%, rgba(255, 206, 156, 0.3) 52.88%)",
              filter: "blur(80px)",
              zIndex: 0,
            }}
          />

          {/* Header */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 p-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <img
                src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/9685203b-b49f-4c52-9caf-7869cce83eb0_20240823082641.png?w=400`}
                alt="Pro Passport"
                className="w-14 h-14 md:w-20 md:h-20 object-contain flex-shrink-0"
              />
              <div className="flex flex-col gap-0.5">
                <h3 className={cn("text-xl md:text-2xl font-bold text-white", syneClassName)}>Pro Passport</h3>
                <p className={cn("text-xs md:text-sm text-white tracking-[0.01em]", rubikClassName)}>All roles. All perks. One price.</p>
              </div>
            </div>
            <div className="flex items-baseline gap-1 justify-center sm:flex-col sm:items-end flex-shrink-0">
              <span
                className={cn("text-[28px] md:text-[36px] leading-tight font-semibold", syneClassName)}
                style={{
                  background: "linear-gradient(0deg, rgba(255,255,255,0.8), rgba(255,255,255,0.8)), linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0px 0px 3.5px rgba(49, 255, 155, 0.7)",
                }}
              >
                &#8377;499
              </span>
              <span className={cn("text-xs md:text-sm tracking-[0.01em]", rubikClassName)} style={{ color: "rgba(255, 255, 255, 0.55)" }}>
                /per month
              </span>
            </div>
          </div>

          {/* Perks */}
          <div className="relative z-10 flex flex-col gap-6 px-4 mt-2">
            {proPerks.map((perk) => (
              <div key={perk.section} className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-8">
                <div className="flex items-center gap-3 sm:w-[200px] flex-shrink-0">
                  {perk.icon}
                  <span className={cn("text-base md:text-lg font-semibold text-white", syneClassName)}>{perk.section}</span>
                </div>
                <div className="flex flex-col gap-2.5 pl-11 sm:pl-0">
                  {perk.items.map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <TickIcon />
                      <span className={cn("text-sm text-white/80", rubikClassName)}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Coming Soon marquee */}
          <div className="relative z-10 mt-4 -mx-6 flex items-center overflow-hidden">
            <div className="flex items-center gap-2 px-6 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-[#FFE880]" />
              <span className={cn("text-xs font-semibold text-[#FFE880] uppercase tracking-wider whitespace-nowrap", rubikClassName)}>Coming soon</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <Marquee speed={20} gradient={false} pauseOnHover>
                {[
                  "Zostel common area access",
                  "Builder tools for listing spaces",
                  "Host community experiences",
                  "City community chats",
                  "Early access across Zo properties",
                  "Zobu travel partner agent",
                  "Hosted experiences around you",
                  "Buy 1 Get 1 Free nights",
                ].map((item) => (
                  <span
                    key={item}
                    className={cn("text-xs text-white/40 border border-white/10 rounded-full px-4 py-1.5 mx-1.5 whitespace-nowrap", rubikClassName)}
                  >
                    {item}
                  </span>
                ))}
              </Marquee>
            </div>
          </div>

          {/* CTA Button */}
          <div className="relative z-10 flex justify-center mt-4">
            <button
              onClick={() => startJourney("Passport")}
              className={cn("px-8 py-[14px] text-center font-medium text-base text-[#111111] rounded-xl", rubikClassName)}
              style={{
                background: "linear-gradient(0deg, #FFFFFF, #FFFFFF), linear-gradient(89.93deg, #B9FFCF 1.66%, #FFE880 31.68%, #FFB591 64.46%, #FFB4CA 97.11%)",
              }}
            >
              Get Pro Passport
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default WhatsNewSection;
