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
import { useAuth } from "@zo/auth";
import {
  IconBrandGithub,
  IconBrandX,
  IconRocket,
  IconTrendingUp,
  IconFlame,
  IconExternalLink,
  IconLock,
  IconWorld,
  IconArrowRight,
  IconCheck,
  IconBolt,
  IconAlertTriangle,
  IconRefresh,
} from "@tabler/icons-react";
import { AuthCorner } from "@/components/AuthCorner";
import { LOGO_URL } from "@/lib/assets";
import type { SelfProfile } from "@/lib/builder-types";

const navItems = [
  { name: "Quests", link: "/" },
  { name: "Leaderboard", link: "/leaderboard" },
  { name: "Projects", link: "/projects" },
  { name: "Grants", link: "/grants" },
];

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

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

export default function ProfilePage() {
  const router = useRouter();
  const { isLoggedIn, showLoginModal } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<SelfProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const reloadProfile = () =>
    fetch("/api/profile/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setProfile(d))
      .catch(() => null);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      const r = await fetch("/api/profile/refresh", { method: "POST" });
      const d = await r.json();
      if (r.ok) {
        setRefreshMsg(
          d.shipsAdded === 0
            ? "Up to date — no new ships."
            : `+${d.shipsAdded} ship${d.shipsAdded === 1 ? "" : "s"}, +${d.productsAdded} product${d.productsAdded === 1 ? "" : "s"}.`,
        );
        await reloadProfile();
      } else {
        setRefreshMsg(d.error ?? "Refresh failed.");
      }
    } catch {
      setRefreshMsg("Refresh failed.");
    } finally {
      setRefreshing(false);
      setTimeout(() => setRefreshMsg(null), 4000);
    }
  };

  const justConnected =
    typeof router.query.connected === "string" ? router.query.connected : null;
  const oauthError =
    typeof router.query.error === "string" ? router.query.error : null;

  useEffect(() => {
    if (isLoggedIn === false) {
      setLoading(false);
      return;
    }
    if (!isLoggedIn) return;
    reloadProfile().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const githubConnected =
    profile?.accounts.some((a) => a.provider === "github") ?? false;
  const xConnected = profile?.accounts.some((a) => a.provider === "x") ?? false;

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
        {!isLoggedIn && !loading && (
          <div className="mx-auto max-w-md rounded-2xl border border-zui-stroke bg-zui-lighter p-10 text-center">
            <h1 className="font-headline text-4xl tracking-tight text-zui-white">
              Sign in to see your profile
            </h1>
            <p className="mt-3 text-sm text-zui-white/60">
              Your builder profile lives here. Connect GitHub and X to start
              scoring.
            </p>
            <button
              type="button"
              onClick={() => showLoginModal(["mobile"])}
              className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-zui-green/60 bg-zui-green px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zui-dark hover:scale-[1.03]"
            >
              Sign in
              <IconArrowRight size={13} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {isLoggedIn && profile && (
          <>
            {justConnected && (
              <div className="mb-6 flex items-center gap-2 rounded-xl border border-zui-green/40 bg-zui-green/10 px-4 py-3 text-sm text-zui-green">
                <IconCheck size={16} strokeWidth={3} />
                {justConnected === "github"
                  ? "GitHub connected — pulling your last 30 days…"
                  : justConnected === "x"
                  ? "X connected — scanning recent posts…"
                  : "Connected"}
              </div>
            )}

            {oauthError && (
              <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                <IconAlertTriangle size={16} strokeWidth={2.5} />
                {oauthError === "oauth_not_configured"
                  ? "GitHub OAuth isn't set up yet — admin needs to add credentials."
                  : oauthError === "oauth_state_mismatch"
                  ? "Connection link expired or tampered. Try again."
                  : oauthError === "oauth_invalid"
                  ? "GitHub returned an invalid response. Try again."
                  : oauthError === "not_signed_in"
                  ? "You need to be signed in to connect."
                  : oauthError === "oauth_failed"
                  ? "Couldn't complete the connection. Try again."
                  : `Couldn't connect: ${oauthError.replace(/^oauth_/, "")}`}
              </div>
            )}

            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="font-headline text-5xl tracking-tight text-zui-white md:text-6xl">
                  @{profile.handle}
                </h1>
                <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-zui-white/60">
                  {profile.title} · Level {profile.level} ·{" "}
                  {profile.lifetimeXp.toLocaleString()} XP
                </p>
              </div>
              <Link
                href={`/builders/${profile.handle}`}
                className="inline-flex w-fit items-center gap-1.5 rounded-md border border-zui-stroke bg-zui-light/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zui-white/80 hover:bg-zui-light/60"
              >
                View public profile
                <IconExternalLink size={12} />
              </Link>
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
                suffix={` · ${profile.streakDays}d streak`}
              />
            </div>

            {profile.hint && (
              <div className="mb-8 flex items-center gap-2 rounded-xl border border-zui-stroke bg-zui-lighter px-4 py-3">
                <IconBolt size={14} className="text-zui-green" />
                <p className="text-sm text-zui-white/80">{profile.hint}</p>
              </div>
            )}

            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zui-white/60">
              Connected accounts
            </h2>
            <div className="mb-10 grid gap-3 md:grid-cols-2">
              <ConnectTile
                icon={IconBrandGithub}
                label="GitHub"
                connected={githubConnected}
                handle={
                  profile.accounts.find((a) => a.provider === "github")?.handle
                }
                href="/api/connect/github"
              />
              <ConnectTile
                icon={IconBrandX}
                label="X (Twitter)"
                connected={xConnected}
                handle={
                  profile.accounts.find((a) => a.provider === "x")?.handle
                }
                href="/api/connect/x"
              />
            </div>

            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zui-white/60">
                Recent ships
              </h2>
              {githubConnected && (
                <div className="flex items-center gap-3">
                  {refreshMsg && (
                    <span className="text-[10px] uppercase tracking-wider text-zui-green">
                      {refreshMsg}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={onRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 rounded-md border border-zui-stroke bg-zui-light/40 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zui-white/70 transition hover:bg-zui-light/60 disabled:opacity-50"
                  >
                    <IconRefresh
                      size={11}
                      className={refreshing ? "animate-spin" : ""}
                    />
                    {refreshing ? "Refreshing…" : "Refresh"}
                  </button>
                </div>
              )}
            </div>
            <div className="mb-10 overflow-hidden rounded-2xl border border-zui-stroke bg-zui-lighter">
              {profile.recentShips.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-zui-white/50">
                  No ships yet. Connect GitHub above to import your last 30 days.
                </div>
              )}
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

            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zui-white/60">
              Products
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {profile.products.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-zui-stroke bg-zui-lighter p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-headline text-lg tracking-tight text-zui-white">
                        {p.name}
                      </p>
                      <p className="truncate text-[10px] uppercase tracking-wider text-zui-white/50">
                        {p.repoFullName} · {p.language ?? "—"} · ★ {p.stars}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                        p.isPublic
                          ? "border-zui-green/60 bg-zui-green/10 text-zui-green"
                          : "border-zui-stroke bg-zui-light/40 text-zui-white/60"
                      }`}
                    >
                      {p.isPublic ? (
                        <>
                          <IconWorld size={11} />
                          Public
                        </>
                      ) : (
                        <>
                          <IconLock size={11} />
                          Private
                        </>
                      )}
                    </button>
                  </div>
                  <a
                    href={p.homepageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-zui-white/80 hover:text-zui-green"
                  >
                    {p.homepageUrl.replace(/^https?:\/\//, "")}
                    <IconExternalLink size={11} />
                  </a>
                </div>
              ))}
              {profile.products.length === 0 && (
                <div className="md:col-span-2 rounded-2xl border border-dashed border-zui-stroke bg-zui-lighter p-10 text-center text-sm text-zui-white/60">
                  Auto-detected from your GitHub repos with a homepage URL. Connect GitHub to begin.
                </div>
              )}
            </div>
          </>
        )}

        {loading && isLoggedIn && (
          <div className="px-4 py-20 text-center text-sm text-zui-white/50">
            Loading your profile…
          </div>
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

function ConnectTile({
  icon: Icon,
  label,
  connected,
  handle,
  href,
}: {
  icon: typeof IconBrandGithub;
  label: string;
  connected: boolean;
  handle?: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-zui-stroke bg-zui-lighter p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-zui-stroke bg-zui-light/40">
          <Icon size={18} className="text-zui-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zui-white">{label}</p>
          <p className="text-[10px] uppercase tracking-wider text-zui-white/50">
            {connected ? `@${handle ?? "linked"}` : "Not connected"}
          </p>
        </div>
      </div>
      {connected ? (
        <span className="flex items-center gap-1 rounded-md border border-zui-green/60 bg-zui-green/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zui-green">
          <IconCheck size={11} strokeWidth={3} />
          Linked
        </span>
      ) : (
        <a
          href={href}
          className="flex items-center gap-1.5 rounded-md border border-zui-green/60 bg-zui-green px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zui-dark hover:scale-[1.03]"
        >
          Connect
          <IconArrowRight size={11} strokeWidth={3} />
        </a>
      )}
    </div>
  );
}
