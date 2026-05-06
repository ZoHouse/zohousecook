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
import { useRouter } from "next/router";
import {
  IconBrandGithub,
  IconBrandX,
  IconRocket,
  IconTrendingUp,
  IconFlame,
  IconExternalLink,
  IconWorld,
} from "@tabler/icons-react";
import { AuthCorner } from "@/components/AuthCorner";
import { LOGO_URL } from "@/lib/assets";
import type { PublicProfile } from "@/lib/builder-types";

const navItems = [
  { name: "Quests", link: "/" },
  { name: "Leaderboard", link: "/leaderboard" },
  { name: "Projects", link: "/projects" },
  { name: "Grants", link: "/grants" },
];

const KIND_LABEL: Record<string, string> = {
  pr_merged: "PR merged",
  release: "Release",
  commit: "Commit",
  product_launch: "Product launch",
  x_post: "X post",
  star_earned: "Star earned",
  npm_publish: "npm publish",
  repo_created: "Repo created",
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function PublicBuilderPage() {
  const router = useRouter();
  const handle = router.query.handle as string | undefined;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!handle) return;
    fetch(`/api/builders/${handle}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setProfile(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [handle]);

  const heatmapMax = Math.max(1, ...(profile?.heatmap.map((d) => d.count) ?? []));

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

      <section className="mx-auto max-w-4xl px-4 pb-24 pt-32">
        {loading && (
          <div className="px-4 py-20 text-center text-sm text-zui-white/50">
            Loading profile…
          </div>
        )}

        {!loading && !profile && (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-zui-stroke bg-zui-lighter p-10 text-center">
            <h1 className="font-headline text-3xl tracking-tight text-zui-white">
              Builder not found
            </h1>
            <p className="mt-3 text-sm text-zui-white/60">
              No builder with handle @{handle} on Zo yet.
            </p>
            <Link
              href="/leaderboard"
              className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-zui-green/60 bg-zui-green px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zui-dark hover:scale-[1.03]"
            >
              See leaderboard
            </Link>
          </div>
        )}

        {profile && (
          <>
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="font-headline text-5xl tracking-tight text-zui-white md:text-6xl">
                  @{profile.handle}
                </h1>
                <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-zui-white/60">
                  {profile.title} · Level {profile.level} ·{" "}
                  {profile.lifetimeXp.toLocaleString()} XP
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.accounts.map((a) => (
                    <a
                      key={a.provider}
                      href={
                        a.provider === "github"
                          ? `https://github.com/${a.handle}`
                          : `https://x.com/${a.handle}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-md border border-zui-stroke bg-zui-light/40 px-2.5 py-1 text-[11px] text-zui-white/80 hover:bg-zui-light/60"
                    >
                      {a.provider === "github" ? (
                        <IconBrandGithub size={12} />
                      ) : (
                        <IconBrandX size={12} />
                      )}
                      @{a.handle}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-8 grid gap-3 md:grid-cols-3">
              <ScoreTile
                icon={IconRocket}
                label="Ship"
                value={profile.scores7d.ship}
                accent="text-zui-green"
              />
              <ScoreTile
                icon={IconTrendingUp}
                label="Reach"
                value={profile.scores7d.reach}
                accent="text-zui-pink"
              />
              <ScoreTile
                icon={IconFlame}
                label="Consistency"
                value={profile.scores7d.consistency}
                accent="text-amber-400"
                suffix={`${profile.streakDays}d`}
              />
            </div>

            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zui-white/60">
              Last 12 weeks
            </h2>
            <div className="mb-10 rounded-2xl border border-zui-stroke bg-zui-lighter p-4">
              <div className="grid grid-cols-12 gap-1 md:grid-cols-[repeat(84,minmax(0,1fr))]">
                {profile.heatmap
                  .slice()
                  .reverse()
                  .map((d) => {
                    const intensity = d.count / heatmapMax;
                    const opacity =
                      d.count === 0 ? 0.08 : 0.25 + intensity * 0.75;
                    return (
                      <div
                        key={d.date}
                        title={`${d.date}: ${d.count} ships`}
                        className="aspect-square rounded-sm"
                        style={{
                          backgroundColor: `rgba(102,223,72,${opacity})`,
                        }}
                      />
                    );
                  })}
              </div>
            </div>

            {profile.publicProducts.length > 0 && (
              <>
                <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zui-white/60">
                  Products shipped
                </h2>
                <div className="mb-10 grid gap-3 md:grid-cols-2">
                  {profile.publicProducts.map((p) => (
                    <a
                      key={p.id}
                      href={p.homepageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border border-zui-stroke bg-zui-lighter p-4 transition hover:border-zui-green/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-headline text-lg tracking-tight text-zui-white">
                          {p.name}
                        </p>
                        <IconWorld size={14} className="shrink-0 text-zui-green" />
                      </div>
                      <p className="mt-1 truncate text-[10px] uppercase tracking-wider text-zui-white/50">
                        {p.language ?? "—"} · ★ {p.stars}
                      </p>
                      <p className="mt-2 truncate text-[11px] text-zui-white/70">
                        {p.homepageUrl.replace(/^https?:\/\//, "")}
                      </p>
                    </a>
                  ))}
                </div>
              </>
            )}

            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zui-white/60">
              Recent ships
            </h2>
            <div className="overflow-hidden rounded-2xl border border-zui-stroke bg-zui-lighter">
              {profile.recentShips.map((s) => (
                <a
                  key={s.id}
                  href={s.ref ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 border-b border-zui-stroke px-4 py-3 transition last:border-0 hover:bg-zui-light/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-zui-white">{s.title}</p>
                    <p className="text-[10px] uppercase tracking-wider text-zui-white/50">
                      {KIND_LABEL[s.kind] ?? s.kind} · {s.source} ·{" "}
                      {timeAgo(s.occurredAt)}
                    </p>
                  </div>
                  {s.ref && (
                    <IconExternalLink
                      size={14}
                      className="shrink-0 text-zui-white/40"
                    />
                  )}
                </a>
              ))}
            </div>
          </>
        )}
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

function ScoreTile({
  icon: Icon,
  label,
  value,
  accent,
  suffix,
}: {
  icon: typeof IconRocket;
  label: string;
  value: number;
  accent: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-zui-stroke bg-zui-lighter p-4">
      <div className="flex items-center gap-2">
        <Icon size={14} className={accent} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zui-white/60">
          {label} · 7d
        </span>
      </div>
      <p className="mt-2 font-headline text-4xl tracking-tight text-zui-white">
        {value}
        {suffix && (
          <span className="ml-2 text-xs font-normal tracking-normal text-zui-white/50">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}
