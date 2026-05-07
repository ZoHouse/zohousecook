import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@zo/auth";
import {
  IconTrophy,
  IconRocket,
  IconTrendingUp,
  IconFlame,
  IconArrowRight,
  IconChevronUp,
} from "@tabler/icons-react";
import { AuthCorner } from "@/components/AuthCorner";
import { LOGO_URL } from "@/lib/assets";
import type { LeaderboardRow } from "@/lib/builder-types";

const navItems = [
  { name: "Quests", link: "/" },
  { name: "Leaderboard", link: "/leaderboard" },
  { name: "Projects", link: "/projects" },
  { name: "Grants", link: "/grants" },
];

type Sort = "ship" | "reach" | "consistency";

const SORT_LABEL: Record<Sort, { label: string; icon: typeof IconRocket }> = {
  ship: { label: "Ship", icon: IconRocket },
  reach: { label: "Reach", icon: IconTrendingUp },
  consistency: { label: "Consistency", icon: IconFlame },
};

export default function LeaderboardPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sort, setSort] = useState<Sort>("ship");
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [myHandle, setMyHandle] = useState<string | null>(null);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    fetch(`/api/leaderboard?sort=${sort}`)
      .then((r) => r.json())
      .then((d) => setRows(d.rows))
      .catch(() => setRows([]));
  }, [sort]);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch(`/api/me`)
      .then((r) => r.json())
      .then((d) => setMyHandle(d.handle))
      .catch(() => setMyHandle(null));
  }, [isLoggedIn]);

  const myRow = rows?.find((r) => r.handle === myHandle) ?? null;

  return (
    <div className="min-h-screen bg-zui-dark font-sans text-zui-white">
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <AuthCorner />
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
              <Link
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium tracking-wide text-zui-white"
              >
                {item.name}
              </Link>
            ))}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <section className="mx-auto max-w-5xl px-4 pb-24 pt-32">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zui-pink/40 bg-zui-pink/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zui-pink">
            <IconTrophy size={11} />
            Last 7 days
          </span>
          <h1 className="mt-4 font-headline text-6xl leading-[1.05] tracking-tight text-zui-white md:text-7xl">
            Builder Leaderboard
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zui-white/60">
            Who's shipping right now. Ranked on a rolling 7-day window — old
            ships fade, fresh ones climb.
          </p>
        </div>

        {myRow && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-zui-green/40 bg-zui-green/10 px-5 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zui-green">
                Your rank
              </p>
              <p className="mt-1 font-headline text-2xl tracking-tight text-zui-white">
                @{myRow.handle} — #{myRow.rank} this week
              </p>
            </div>
            <Link
              href="/profile"
              className="flex items-center gap-1.5 rounded-md border border-zui-green/60 bg-zui-green px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-zui-dark hover:scale-[1.03]"
            >
              Your profile
              <IconArrowRight size={13} strokeWidth={2.5} />
            </Link>
          </div>
        )}

        {isLoggedIn && !myRow && rows && (
          <div className="mb-6 rounded-xl border border-dashed border-zui-stroke bg-zui-lighter px-5 py-4 text-center">
            <p className="text-sm text-zui-white/70">
              Connect GitHub on your{" "}
              <Link
                href="/profile"
                className="font-semibold text-zui-green underline-offset-2 hover:underline"
              >
                profile
              </Link>{" "}
              to start scoring.
            </p>
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {(Object.keys(SORT_LABEL) as Sort[]).map((s) => {
            const Icon = SORT_LABEL[s].icon;
            const active = sort === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition ${
                  active
                    ? "border-zui-green bg-zui-green text-zui-dark"
                    : "border-zui-stroke bg-zui-light/40 text-zui-white/70 hover:bg-zui-light/60"
                }`}
              >
                <Icon size={12} strokeWidth={2.5} />
                Sort by {SORT_LABEL[s].label}
              </button>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-2xl border border-zui-stroke bg-zui-lighter">
          <div className="grid grid-cols-[40px_1fr_80px_80px_80px_60px] gap-2 border-b border-zui-stroke bg-zui-light/40 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-zui-white/50 md:grid-cols-[60px_1fr_100px_100px_100px_80px]">
            <div>#</div>
            <div>Builder</div>
            <div className="text-right">Ship</div>
            <div className="text-right">Reach</div>
            <div className="text-right">Consist.</div>
            <div className="text-right">Streak</div>
          </div>

          {rows === null && (
            <div className="px-4 py-12 text-center text-sm text-zui-white/50">
              Loading rankings…
            </div>
          )}

          {rows && rows.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-zui-white/50">
              No builders yet. Be the first to ship this week.
            </div>
          )}

          {rows?.map((row) => {
            const isMe = row.handle === myHandle;
            return (
              <Link
                key={row.userId}
                href={`/builders/${row.handle}`}
                className={`grid grid-cols-[40px_1fr_80px_80px_80px_60px] items-center gap-2 border-b border-zui-stroke px-4 py-3 transition last:border-0 hover:bg-zui-light/40 md:grid-cols-[60px_1fr_100px_100px_100px_80px] ${
                  isMe ? "bg-zui-green/5" : ""
                }`}
              >
                <div className="flex items-center gap-1 font-headline text-lg tracking-tight text-zui-white">
                  {row.rank <= 3 && (
                    <IconChevronUp
                      size={14}
                      className={
                        row.rank === 1
                          ? "text-zui-green"
                          : row.rank === 2
                          ? "text-zui-pink"
                          : "text-zui-white/60"
                      }
                      strokeWidth={3}
                    />
                  )}
                  {row.rank}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-headline text-base tracking-tight text-zui-white">
                    @{row.handle}
                    {isMe && (
                      <span className="ml-2 rounded bg-zui-green px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zui-dark">
                        you
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[10px] uppercase tracking-wider text-zui-white/50">
                    {row.title} · L{row.level}
                  </p>
                </div>
                <div className="text-right font-mono text-sm tabular-nums text-zui-white/90">
                  {row.scores7d.ship}
                </div>
                <div className="text-right font-mono text-sm tabular-nums text-zui-white/90">
                  {row.scores7d.reach}
                </div>
                <div className="text-right font-mono text-sm tabular-nums text-zui-white/90">
                  {row.scores7d.consistency}
                </div>
                <div className="flex items-center justify-end gap-1 font-mono text-sm tabular-nums text-zui-white/90">
                  {row.streakDays > 0 && (
                    <IconFlame size={12} className="text-zui-pink" />
                  )}
                  {row.streakDays}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-zui-stroke bg-zui-lighter px-4 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="Zo" width={28} height={28} className="invert" />
            <span className="font-headline text-2xl tracking-tight text-zui-white">
              Marketplace
            </span>
          </div>
          <p className="text-sm text-zui-white/50">Zo World. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
