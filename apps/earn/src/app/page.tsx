"use client";
import {
  Navbar,
  NavBody,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState, useEffect } from "react";
import {
  IconCoin,
  IconUsers,
  IconClock,
  IconLayoutGrid,
  IconTable,
  IconExternalLink,
  IconFlame,
  IconBolt,
  IconTrophy,
  IconShield,
  IconStar,
  IconCrown,
  IconSwords,
  IconTarget,
  IconDiamond,
  IconMedal,
  IconLock,
  IconCheck,
  IconMapPin,
  IconRoute,
  IconCalendarEvent,
  IconArrowRight,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const navItems = [
  { name: "Quests", link: "/" },
  { name: "Projects", link: "/projects" },
  { name: "Grants", link: "/grants" },
];

type Bounty = {
  id: string;
  title: string;
  description: string | null;
  reward: string;
  applicants: number;
  deadline: string | null;
  tags: string[];
  color: string | null;
  source: string;
  url: string | null;
  imageUrl?: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
  superteam: "Superteam",
  layer3: "Layer3",
  gitcoin: "Gitcoin",
  dework: "Dework",
  replit: "Replit",
  github: "GitHub",
};

type Rarity = "common" | "rare" | "epic" | "legendary";

const RARITY_STYLES: Record<
  Rarity,
  { label: string; bg: string; border: string; text: string; glow: string; icon: typeof IconStar }
> = {
  common: {
    label: "Common",
    bg: "bg-zui-light",
    border: "border-zui-stroke",
    text: "text-zui-white/80",
    glow: "",
    icon: IconShield,
  },
  rare: {
    label: "Rare",
    bg: "bg-zui-blue/15",
    border: "border-zui-blue/40",
    text: "text-zui-blue",
    glow: "hover:shadow-[0_0_24px_0_rgba(106,119,221,0.45)]",
    icon: IconStar,
  },
  epic: {
    label: "Epic",
    bg: "bg-zui-purple/15",
    border: "border-zui-purple/40",
    text: "text-zui-pink",
    glow: "hover:shadow-[0_0_28px_0_rgba(152,3,206,0.5)]",
    icon: IconDiamond,
  },
  legendary: {
    label: "Legendary",
    bg: "bg-zui-yellow/15",
    border: "border-zui-yellow/40",
    text: "text-zui-yellow",
    glow: "legendary-glow",
    icon: IconCrown,
  },
};

function parseReward(reward: string): number {
  if (!reward) return 0;
  const numeric = Number(reward.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function getRarity(reward: string): Rarity {
  const amount = parseReward(reward);
  if (amount >= 5000) return "legendary";
  if (amount >= 1000) return "epic";
  if (amount >= 250) return "rare";
  return "common";
}

function getXP(reward: string): number {
  const amount = parseReward(reward);
  return Math.max(50, Math.round(amount * 2));
}

// Demo player profile (would come from auth in real life)
const PLAYER = {
  handle: "ZoBuilder_01",
  level: 12,
  title: "Bounty Hunter",
  xp: 2340,
  xpMax: 3000,
  zoBalance: 1420,
  streak: 7,
  questsDone: 18,
  combo: 3,
};

const ACHIEVEMENTS = [
  { id: "first-blood", label: "First Blood", desc: "First quest claimed", icon: IconSwords, unlocked: true, color: "#FF9E4C" },
  { id: "centurion", label: "Centurion", desc: "100 contributions", icon: IconShield, unlocked: true, color: "#6A77DD" },
  { id: "streak-7", label: "Week Warrior", desc: "7-day streak", icon: IconFlame, unlocked: true, color: "#FFD600" },
  { id: "whale", label: "Whale", desc: "Earn $10k+", icon: IconDiamond, unlocked: false, color: "#9803CE" },
  { id: "legendary", label: "Legendary", desc: "Claim a legendary quest", icon: IconCrown, unlocked: false, color: "#CFFF50" },
  { id: "sharpshooter", label: "Sharpshooter", desc: "5 wins in a row", icon: IconTarget, unlocked: true, color: "#66DF48" },
  { id: "guild-master", label: "Guild Master", desc: "Invite 10 builders", icon: IconMedal, unlocked: false, color: "#FF2F8E" },
  { id: "apex", label: "Apex", desc: "Reach level 50", icon: IconTrophy, unlocked: false, color: "#FF4545" },
];

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBounties() {
      try {
        const params = new URLSearchParams();
        if (sourceFilter) params.set("source", sourceFilter);
        const res = await fetch(`${basePath}/api/bounties?${params.toString()}`);
        const data = await res.json();
        setBounties(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch bounties:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBounties();
  }, [sourceFilter]);

  const xpPct = Math.min(100, Math.round((PLAYER.xp / PLAYER.xpMax) * 100));

  return (
    <div className="min-h-screen bg-zui-dark font-sans text-zui-white">
      {/* Navbar */}
      <Navbar>
        <NavBody>
          <div className="flex items-center gap-6">
            <NavbarLogo />
            <nav className="flex items-center gap-1 text-sm font-medium tracking-wide text-zui-white/70">
              {navItems.map((item, idx) => (
                <a
                  key={`nav-link-${idx}`}
                  href={item.link}
                  className="rounded-md border border-transparent px-3 py-1.5 transition-colors hover:border-zui-stroke hover:bg-zui-light/60 hover:text-zui-white"
                >
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <NavChip xpPct={xpPct} />
            <NavbarButton variant="primary">Post a Quest</NavbarButton>
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium tracking-wide text-zui-white"
              >
                {item.name}
              </a>
            ))}
            <div className="flex w-full flex-col gap-4">
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full"
              >
                Post a Quest
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Player Chip — mobile only (desktop uses NavChip inside navbar) */}
      <div className="lg:hidden">
        <PlayerChip xpPct={xpPct} />
      </div>

      {/* Body — main on the left (capped at 6xl), events hug the far right edge */}
      <div className="flex flex-col lg:flex-row lg:items-start">
        <main className="min-w-0 flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-32">
          <SeasonPath />

          <section id="bounties" className="mt-12">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <IconSwords size={16} className="text-zui-green" />
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-zui-white/50">
                Quest Board
              </span>
            </div>
            <h2 className="font-headline text-6xl leading-[1.05] tracking-tight text-zui-white md:text-7xl">
              Open Quests
            </h2>
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-medium uppercase tracking-[0.15em] text-zui-white/40">
              <span className="text-zui-white">{bounties.length || "—"}</span> live
              <span className="text-zui-white/20">·</span>
              <span className="text-zui-white">$128K</span> paid
              <span className="text-zui-white/20">·</span>
              <span className="text-zui-white">1,200</span> hunters
              <span className="text-zui-white/20">·</span>
              <span className="text-zui-white">85</span> guilds
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSourceFilter(null)}
                className={`rounded-full border px-3.5 py-1 text-xs font-medium tracking-wide transition-colors ${
                  !sourceFilter
                    ? "border-zui-green bg-zui-green text-zui-dark"
                    : "border-zui-stroke bg-zui-light/40 text-zui-white/70 hover:border-zui-white/30 hover:text-zui-white"
                }`}
              >
                All
              </button>
              {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSourceFilter(key)}
                  className={`rounded-full border px-3.5 py-1 text-xs font-medium tracking-wide transition-colors ${
                    sourceFilter === key
                      ? "border-zui-green bg-zui-green text-zui-dark"
                      : "border-zui-stroke bg-zui-light/40 text-zui-white/70 hover:border-zui-white/30 hover:text-zui-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-zui-stroke bg-zui-light/40 p-1">
              <button
                onClick={() => setViewMode("cards")}
                className={`rounded-md p-2 transition-colors ${
                  viewMode === "cards"
                    ? "bg-zui-green text-zui-dark"
                    : "text-zui-white/60 hover:bg-zui-light hover:text-zui-white"
                }`}
              >
                <IconLayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`rounded-md p-2 transition-colors ${
                  viewMode === "table"
                    ? "bg-zui-green text-zui-dark"
                    : "text-zui-white/60 hover:bg-zui-light hover:text-zui-white"
                }`}
              >
                <IconTable size={18} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-lg font-medium text-zui-white/40">Loading quests...</div>
          </div>
        ) : bounties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-lg font-medium text-zui-white/40">No quests found</div>
            <p className="mt-2 text-sm text-zui-white/30">
              Run the scraper to populate quests.
            </p>
          </div>
        ) : viewMode === "cards" ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {bounties.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>
        ) : (
          <BountyTable bounties={bounties} />
        )}
          </section>
        </main>

        {/* Events — hug the far right edge of the viewport */}
        <aside className="px-4 pb-16 sm:px-6 lg:sticky lg:top-28 lg:ml-auto lg:w-[460px] lg:shrink-0 lg:self-start lg:pr-4 ">
          <ZoEvents />
        </aside>
      </div>

    </div>
  );
}

function NavChip({ xpPct }: { xpPct: number }) {
  const trophiesWon = ACHIEVEMENTS.filter((a) => a.unlocked).length;
  return (
    <div className="flex items-center gap-2 rounded-md border border-zui-stroke bg-zui-light/60 px-2 py-1">
      {/* Avatar + level */}
      <div className="relative shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-zui-green/40 bg-zui-green">
          <span className="text-xs font-bold text-zui-dark">Z</span>
        </div>
        <span className="absolute -bottom-1 -right-1 rounded-sm border border-zui-yellow/60 bg-zui-yellow px-0.5 text-[8px] font-bold leading-none text-zui-dark">
          {PLAYER.level}
        </span>
      </div>

      {/* Inline XP — mini bar + level-next hint */}
      <div className="flex w-28 flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-bold uppercase leading-none tracking-wider text-zui-white/80">
            XP
          </span>
          <span className="text-[8px] font-bold tabular-nums leading-none text-zui-white/50">
            {Math.round((PLAYER.xp / PLAYER.xpMax) * 100)}%
          </span>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-sm border border-zui-stroke bg-zui-dark">
          <div className="xp-bar-fill h-full" style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex items-center gap-1 border-l border-zui-stroke pl-2">
        <span
          title="Streak"
          className="flex items-center gap-0.5 text-[11px] font-bold tabular-nums text-zui-white"
        >
          <IconFlame size={11} className="flame-flicker text-zui-orange" />
          {PLAYER.streak}d
        </span>
        <span
          title="$Zo balance"
          className="flex items-center gap-0.5 text-[11px] font-bold tabular-nums text-zui-white"
        >
          <IconCoin size={11} className="text-zui-yellow" />
          {PLAYER.zoBalance >= 1000
            ? `${(PLAYER.zoBalance / 1000).toFixed(1)}k`
            : PLAYER.zoBalance}
        </span>
        <span
          title="Trophies"
          className="hidden items-center gap-0.5 text-[11px] font-bold tabular-nums text-zui-white xl:flex"
        >
          <IconTrophy size={11} className="text-zui-yellow" />
          {trophiesWon}/{ACHIEVEMENTS.length}
        </span>
      </div>
    </div>
  );
}

function PlayerChip({ xpPct }: { xpPct: number }) {
  const trophiesWon = ACHIEVEMENTS.filter((a) => a.unlocked).length;
  return (
    <section className="mx-auto max-w-6xl px-4 pt-24 md:pt-28">
      <div className="flex items-center gap-3 rounded-xl border border-zui-stroke bg-zui-lighter px-3 py-2.5 md:gap-4 md:px-4 md:py-3">
        {/* Avatar + level */}
        <div className="relative shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zui-green/40 bg-zui-green md:h-11 md:w-11">
            <span className="text-base font-bold text-zui-dark md:text-lg">Z</span>
          </div>
          <span className="absolute -bottom-1.5 -right-1.5 rounded-md border border-zui-yellow/60 bg-zui-yellow px-1 py-0.5 text-[9px] font-bold leading-none text-zui-dark">
            LV {PLAYER.level}
          </span>
        </div>

        {/* Handle + title — hidden on small screens to save space */}
        <div className="hidden min-w-0 flex-col md:flex">
          <span className="truncate text-sm font-bold uppercase leading-tight text-zui-white">
            {PLAYER.handle}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-zui-white/50">
            {PLAYER.title}
          </span>
        </div>

        {/* XP bar — hero of the chip */}
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center justify-between">
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-zui-white">
              <IconBolt size={10} className="text-zui-yellow" /> XP
            </span>
            <span className="text-[9px] font-bold tabular-nums text-zui-white/50">
              {PLAYER.xp.toLocaleString()} / {PLAYER.xpMax.toLocaleString()}
            </span>
          </div>
          <div className="relative h-2.5 w-full overflow-hidden rounded-sm border border-zui-stroke bg-zui-dark">
            <div className="xp-bar-fill h-full" style={{ width: `${xpPct}%` }} />
          </div>
        </div>

        {/* Compact pills */}
        <div className="flex shrink-0 items-center gap-1.5">
          <MiniPill
            icon={<IconFlame size={12} className="flame-flicker text-zui-orange" />}
            value={`${PLAYER.streak}d`}
            title="Streak"
          />
          <MiniPill
            icon={<IconCoin size={12} className="text-zui-yellow" />}
            value={PLAYER.zoBalance.toLocaleString()}
            title="$Zo balance"
          />
          <MiniPill
            icon={<IconTrophy size={12} className="text-zui-yellow" />}
            value={`${trophiesWon}/${ACHIEVEMENTS.length}`}
            title="Trophies"
            hideOnMobile
          />
        </div>
      </div>
    </section>
  );
}

function MiniPill({
  icon,
  value,
  title,
  hideOnMobile,
}: {
  icon: React.ReactNode;
  value: string;
  title: string;
  hideOnMobile?: boolean;
}) {
  return (
    <div
      title={title}
      className={`flex items-center gap-1 rounded-md border border-zui-stroke bg-zui-light/60 px-1.5 py-1 ${
        hideOnMobile ? "hidden sm:flex" : ""
      }`}
    >
      {icon}
      <span className="text-[11px] font-bold tabular-nums text-zui-white">
        {value}
      </span>
    </div>
  );
}

// Demo path nodes — would be derived from user progress + curated season quests
type PathStatus = "done" | "current" | "locked";
type PathNode = { id: number; status: PathStatus; label: string };

const SEASON_PATH: PathNode[] = [
  { id: 1, status: "done", label: "Intro" },
  { id: 2, status: "done", label: "First Blood" },
  { id: 3, status: "done", label: "Solana" },
  { id: 4, status: "done", label: "React" },
  { id: 5, status: "current", label: "Layer3" },
  { id: 6, status: "locked", label: "Content" },
  { id: 7, status: "locked", label: "Design" },
  { id: 8, status: "locked", label: "AI Agents" },
  { id: 9, status: "locked", label: "Web3" },
  { id: 10, status: "locked", label: "Boss" },
];

type ZoEvent = {
  id: string;
  title: string;
  house: "BLRxZo" | "WTFxZo";
  date: string;
  time: string;
  tag: string;
  color: string;
  image?: string;
};

const ZO_EVENTS: ZoEvent[] = [
  {
    id: "evt-1",
    title: "Founder Friday — Breakfast with builders",
    house: "BLRxZo",
    date: "Fri · Apr 25",
    time: "9:00 AM",
    tag: "Community",
    color: "#FF9E4C",
    image: `${basePath}/claw.png`,
  },
  {
    id: "evt-2",
    title: "AI Agents Hackathon — 24hr sprint",
    house: "WTFxZo",
    date: "Sat · Apr 26",
    time: "10 AM – 10 PM",
    tag: "Hackathon",
    color: "#FFD600",
  },
  {
    id: "evt-3",
    title: "Zo Demo Day — S1 cohort showcase",
    house: "BLRxZo",
    date: "Wed · Apr 30",
    time: "6:30 PM",
    tag: "Demo Day",
    color: "#66DF48",
  },
  {
    id: "evt-4",
    title: "Solana Bangalore Meetup",
    house: "WTFxZo",
    date: "Thu · May 1",
    time: "7:00 PM",
    tag: "Meetup",
    color: "#9803CE",
  },
  {
    id: "evt-5",
    title: "Residents Dinner — invite only",
    house: "BLRxZo",
    date: "Sat · May 3",
    time: "8:00 PM",
    tag: "Residents",
    color: "#FF2F8E",
  },
];

const CAROUSEL_INTERVAL_MS = 4500;

function ZoEvents() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % ZO_EVENTS.length);
    }, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <IconCalendarEvent size={14} className="text-zui-green" />
          <span className="text-[11px] font-medium uppercase tracking-widest text-zui-white">
            This week at Zo
          </span>
        </div>
        <a
          href="https://zo.house"
          className="flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wider text-zui-white/50 transition-colors hover:text-zui-white"
        >
          All
          <IconArrowRight size={11} />
        </a>
      </div>

      <div
        className="group relative overflow-hidden rounded-xl border border-zui-stroke bg-zui-lighter shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]"
        style={{ aspectRatio: "9 / 16" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Sliding track — 100% width per slide */}
        <div
          className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {ZO_EVENTS.map((event) => (
            <EventBanner key={event.id} event={event} />
          ))}
        </div>

        {/* Progress bar */}
        <div className="absolute inset-x-0 top-0 z-10 h-1 bg-zui-white/10">
          <div
            key={`${idx}-${paused}`}
            className="h-full bg-zui-green"
            style={{
              width: "100%",
              animation: paused
                ? "none"
                : `zoEventProgress ${CAROUSEL_INTERVAL_MS}ms linear forwards`,
            }}
          />
        </div>

        {/* Prev / next arrows — visible on hover */}
        <button
          type="button"
          aria-label="Previous event"
          onClick={() =>
            setIdx((i) => (i - 1 + ZO_EVENTS.length) % ZO_EVENTS.length)
          }
          className="absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-zui-stroke bg-zui-dark/80 opacity-0 backdrop-blur-sm transition-opacity hover:bg-zui-dark group-hover:opacity-100"
        >
          <IconChevronLeft size={14} strokeWidth={2.5} className="text-zui-white" />
        </button>
        <button
          type="button"
          aria-label="Next event"
          onClick={() => setIdx((i) => (i + 1) % ZO_EVENTS.length)}
          className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-zui-stroke bg-zui-dark/80 opacity-0 backdrop-blur-sm transition-opacity hover:bg-zui-dark group-hover:opacity-100"
        >
          <IconChevronRight size={14} strokeWidth={2.5} className="text-zui-white" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-1.5">
        {ZO_EVENTS.map((e, i) => (
          <button
            type="button"
            key={e.id}
            onClick={() => setIdx(i)}
            aria-label={`Go to event ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-6 bg-zui-green" : "w-1.5 bg-zui-white/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function EventBanner({ event }: { event: ZoEvent }) {
  const [day, dateNum] = event.date.split(" · ");
  return (
    <a
      href="#"
      className="group relative flex h-full w-full shrink-0 basis-full flex-col"
    >
      {/* Visual area — takes ~62% of height */}
      <div className="relative flex-1">
        {event.image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="absolute inset-0 mix-blend-multiply"
              style={{ backgroundColor: `${event.color}22` }}
            />
          </>
        ) : (
          <>
            {/* Solid color bg + diagonal stripes */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: event.color,
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0 14px, transparent 14px 28px)",
              }}
            />
            {/* Hero — giant day + date centered so the middle isn't empty */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <span
                className="text-sm font-black uppercase tracking-[0.3em] text-white/80"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
              >
                {day}
              </span>
              <span
                className="mt-1 font-black tracking-tight text-white"
                style={{
                  fontSize: "96px",
                  lineHeight: 1,
                  textShadow: "0 3px 6px rgba(0,0,0,0.35)",
                }}
              >
                {dateNum.split(" ")[1] || dateNum}
              </span>
              <span
                className="mt-1 text-xs font-black uppercase tracking-[0.25em] text-white/80"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
              >
                {dateNum.split(" ")[0]}
              </span>
            </div>
          </>
        )}

        {/* Top-right tag + house */}
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          <span className="rounded-full border border-zui-stroke bg-zui-dark/80 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-zui-white backdrop-blur-sm">
            {event.tag}
          </span>
          <span
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-zui-green" />
            {event.house}
          </span>
        </div>

        {/* For image events only — date stamp top-left over the photo */}
        {event.image && (
          <div className="absolute left-4 top-4 flex flex-col leading-none">
            <span
              className="text-[11px] font-black uppercase tracking-[0.2em] text-white"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
            >
              {day}
            </span>
            <span
              className="mt-1 font-black tracking-tight text-white"
              style={{
                fontSize: "36px",
                lineHeight: 1,
                textShadow: "0 2px 4px rgba(0,0,0,0.55)",
              }}
            >
              {dateNum}
            </span>
          </div>
        )}
      </div>

      {/* Info strip — bottom, dark surface separated by stroke */}
      <div className="border-t border-zui-stroke bg-zui-lighter px-4 py-3">
        <h4 className="mb-1.5 line-clamp-2 text-sm font-bold leading-tight text-zui-white">
          {event.title}
        </h4>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zui-white/50">
            {event.time}
          </span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-zui-green/40 bg-zui-green text-zui-dark transition-transform group-hover:translate-x-0.5">
            <IconArrowRight size={10} strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </a>
  );
}

function SeasonPath() {
  const doneCount = SEASON_PATH.filter((n) => n.status === "done").length;
  const progressPct = Math.max(
    0,
    Math.min(100, ((doneCount - 0.5) / (SEASON_PATH.length - 1)) * 100),
  );

  return (
    <div className="rounded-2xl border border-zui-stroke bg-zui-lighter px-5 py-4 md:px-6 md:py-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconRoute size={14} className="text-zui-green" />
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-zui-white">
            Season 1 Path · The First Hunt
          </span>
          <span className="hidden rounded-full border border-zui-green/40 bg-zui-green/15 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-zui-green sm:inline">
            Live
          </span>
        </div>
        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-zui-white/50">
          {doneCount} / {SEASON_PATH.length} cleared
        </span>
      </div>

      {/* Path track */}
      <div className="relative overflow-x-auto pb-1">
        <div className="relative min-w-[720px]">
          {/* Dashed background line */}
          <div
            className="absolute left-5 right-5 top-[21px] border-t-[2px] border-dashed border-zui-stroke"
            aria-hidden
          />
          {/* Progress line (solid green over completed segments) */}
          <div
            className="absolute top-[21px] h-[2px] bg-zui-green"
            style={{ left: "20px", width: `calc(${progressPct}% - 10px)` }}
            aria-hidden
          />

          {/* Nodes */}
          <div className="relative flex justify-between">
            {SEASON_PATH.map((node) => (
              <PathNodeMarker key={node.id} node={node} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PathNodeMarker({ node }: { node: PathNode }) {
  const base =
    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-[2px] transition-all";
  const styles =
    node.status === "done"
      ? "bg-zui-green border-zui-green/60"
      : node.status === "current"
      ? "bg-zui-yellow border-zui-yellow/60 ring-4 ring-zui-yellow/25"
      : "bg-zui-light border-zui-stroke opacity-70";

  return (
    <a
      href="#bounties"
      className="group flex flex-col items-center gap-1"
      title={node.label}
    >
      <div className={`${base} ${styles} ${node.status === "current" ? "animate-pulse" : ""}`}>
        {node.status === "done" && (
          <IconCheck size={18} strokeWidth={3} className="text-zui-dark" />
        )}
        {node.status === "current" && (
          <IconMapPin size={16} strokeWidth={2.5} className="text-zui-dark" />
        )}
        {node.status === "locked" && (
          <IconLock size={13} className="text-zui-white/40" />
        )}
      </div>
      <span
        className={`text-[9px] font-medium uppercase tracking-wider ${
          node.status === "locked" ? "text-zui-white/30" : "text-zui-white"
        } whitespace-nowrap`}
      >
        {node.label}
      </span>
      {node.status === "current" && (
        <span className="-mt-0.5 text-[8px] font-bold uppercase tracking-widest text-zui-green">
          You
        </span>
      )}
    </a>
  );
}

function RarityBadge({ rarity }: { rarity: Rarity }) {
  const style = RARITY_STYLES[rarity];
  const Icon = style.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${style.bg} ${style.border} ${style.text}`}
    >
      <Icon size={11} />
      {style.label}
    </span>
  );
}

function BountyCard({ bounty }: { bounty: Bounty }) {
  const rarity = getRarity(bounty.reward);
  const xp = getXP(bounty.reward);
  const style = RARITY_STYLES[rarity];
  const slotsMax = 20;
  const slotsFilled = Math.min(slotsMax, bounty.applicants);
  const progressPct = Math.round((slotsFilled / slotsMax) * 100);
  const isHot = bounty.applicants >= 10;

  return (
    <a
      href={bounty.url || "#"}
      target={bounty.url ? "_blank" : undefined}
      rel="noopener noreferrer"
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-zui-stroke bg-zui-lighter transition-all hover:-translate-y-1 hover:border-zui-white/20 ${style.glow}`}
    >
      {/* Sheen overlay */}
      <div className="rarity-sheen pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-xl" />

      {/* Colored strip */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: bounty.color || "#66DF48" }}
      />

      {/* Rarity + XP header strip */}
      <div className={`flex items-center justify-between border-b border-zui-stroke bg-zui-light/40 px-4 py-2`}>
        <RarityBadge rarity={rarity} />
        <div className="flex items-center gap-1.5">
          {isHot && (
            <span className="flex items-center gap-0.5 rounded-full border border-zui-orange/40 bg-zui-orange/15 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-zui-orange">
              <IconFlame size={10} /> Hot
            </span>
          )}
          <span className="flex items-center gap-0.5 rounded-full border border-zui-yellow/40 bg-zui-yellow/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zui-yellow">
            <IconBolt size={10} /> +{xp} XP
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-start gap-3">
          {/* Project logo — square avatar; falls back to first letter if no image */}
          <div
            className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zui-stroke"
            style={{ backgroundColor: bounty.color || "#202020" }}
          >
            {bounty.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bounty.imageUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="text-xl font-bold text-zui-white">
                {bounty.title.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <span
                className="rounded-full border border-zui-stroke px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zui-white"
                style={{ backgroundColor: `${bounty.color || "#202020"}33` }}
              >
                {SOURCE_LABELS[bounty.source] || bounty.source}
              </span>
              {bounty.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-zui-stroke bg-zui-light/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zui-white/70"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h3 className="text-base font-semibold leading-snug text-zui-white">
              {bounty.title}
            </h3>
          </div>
        </div>
        {bounty.description && (
          <p className="mb-4 flex-1 text-sm text-zui-white/60">
            {bounty.description}
          </p>
        )}

        {/* Slots progress bar */}
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider">
            <span className="flex items-center gap-1 text-zui-white/50">
              <IconUsers size={11} />
              Slots Filled
            </span>
            <span className="text-zui-white">
              {slotsFilled} / {slotsMax}
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-sm border border-zui-stroke bg-zui-dark">
            <div
              className="h-full bg-gradient-to-r from-zui-green via-zui-neon to-zui-green"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-dashed border-zui-stroke pt-3">
          <div className="flex items-center gap-1 text-base font-bold text-zui-white">
            <IconCoin size={18} className="text-zui-yellow" />
            {bounty.reward}
          </div>
          <div className="flex items-center gap-3 text-xs text-zui-white/50">
            {bounty.deadline && (
              <span className="flex items-center gap-1">
                <IconClock size={14} />
                {bounty.deadline}
              </span>
            )}
            <span className="flex items-center gap-1 rounded-full border border-zui-green/60 bg-zui-green px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zui-dark transition-transform group-hover:scale-105">
              Accept
              {bounty.url && <IconExternalLink size={11} />}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

function BountyTable({ bounties }: { bounties: Bounty[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zui-stroke bg-zui-lighter">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zui-stroke bg-zui-light/40">
            <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-zui-white/60">
              Quest
            </th>
            <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-zui-white/60">
              Rarity
            </th>
            <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-zui-white/60">
              Source
            </th>
            <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-zui-white/60">
              Slots
            </th>
            <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-zui-white/60">
              Reward · XP
            </th>
            <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-zui-white/60">
              Deadline
            </th>
          </tr>
        </thead>
        <tbody>
          {bounties.map((bounty, idx) => {
            const rarity = getRarity(bounty.reward);
            const xp = getXP(bounty.reward);
            const slotsMax = 20;
            const slotsFilled = Math.min(slotsMax, bounty.applicants);
            const progressPct = Math.round((slotsFilled / slotsMax) * 100);
            return (
              <tr
                key={bounty.id}
                onClick={() => bounty.url && window.open(bounty.url, "_blank")}
                className={`cursor-pointer transition-colors hover:bg-zui-light/40 ${
                  idx !== bounties.length - 1
                    ? "border-b border-dashed border-zui-stroke"
                    : ""
                }`}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: bounty.color || "#66DF48" }}
                    />
                    <div>
                      <p className="font-bold leading-tight text-zui-white">
                        {bounty.title}
                      </p>
                      {bounty.description && (
                        <p className="mt-0.5 text-xs text-zui-white/50">
                          {bounty.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <RarityBadge rarity={rarity} />
                </td>
                <td className="px-5 py-4">
                  <span
                    className="rounded-md border border-zui-stroke px-2 py-0.5 text-xs font-bold uppercase text-zui-white"
                    style={{ backgroundColor: `${bounty.color || "#202020"}33` }}
                  >
                    {SOURCE_LABELS[bounty.source] || bounty.source}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex w-28 flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-zui-white/70">
                      <span>
                        {slotsFilled}/{slotsMax}
                      </span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-sm border border-zui-stroke bg-zui-dark">
                      <div
                        className="h-full bg-gradient-to-r from-zui-green to-zui-neon"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1 text-sm font-bold text-zui-white">
                      <IconCoin size={16} className="text-zui-yellow" />
                      {bounty.reward}
                    </div>
                    <div className="flex items-center gap-0.5 text-[10px] font-bold uppercase text-zui-yellow">
                      <IconBolt size={10} />
                      +{xp} XP
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 text-sm text-zui-white/60">
                    {bounty.deadline ? (
                      <>
                        <IconClock size={14} />
                        {bounty.deadline}
                      </>
                    ) : (
                      <span className="text-zui-white/30">—</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
