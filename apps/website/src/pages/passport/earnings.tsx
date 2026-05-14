import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth, useProfile } from '@zo/auth';
import { Warp } from '@paper-design/shaders-react';
import { MapModal } from '../../components/passport-lobby/MapModal';
import { TopBar } from '../../components/passport-lobby/TopBar';
import { PageHeaderPill } from '../../components/passport-lobby/PageHeaderPill';
import { useMyXp } from '../../hooks/useMyXp';

/**
 * Earnings dashboard — surfaced at /@{handle}/earnings via next.config rewrite
 * (rewrite rule strips to /passport/earnings?handle=:handle).
 *
 * Two columns: Creator (submissions + bed drops + bounty + views) and
 * Affiliate (passport unlocks + referral commissions). Hardcoded sample data
 * for now — when Daya ships the v2 endpoint, wire via zoServer.
 */

const GREEN = '#B4FF00';
const TEXT_MUTED = '#9CA3AF';
// Creator-Pass pink/purple Warp palette — deep violet void through Creator
// magenta to lavender highlight. Matches the Creator tier card colors
// (#33005B → #8A26C2 → #C26BE8 → #EED1FF) so the earnings surface reads as
// the same palette family.
const WARP_COLORS = [
  '#0A0012',
  '#1A0033',
  '#33005B',
  '#6B0A9E',
  '#8A26C2',
  '#B330F5',
  '#C26BE8',
  '#1A0033',
];
// Glass sitting on the Warp flow — pink-tinted borders tie into the Creator
// magenta so the card reads as "cut from the same light" as the background.
const CARD_GLASS: React.CSSProperties = {
  background: 'rgba(10, 0, 18, 0.45)',
  backdropFilter: 'blur(22px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(22px) saturate(1.2)',
  border: '1px solid rgba(194, 107, 232, 0.18)',
  boxShadow:
    'inset 0 1px 0 rgba(238,209,255,0.1), inset 0 0 80px rgba(51,0,91,0.2), 0 12px 40px rgba(0,0,0,0.6)',
};
const DIVIDER = 'rgba(255,255,255,0.12)';

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px]" style={{ color: TEXT_MUTED }}>{label}</span>
      <span className="text-white text-[20px] font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function InstagramIcon({ size = 40 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: 'linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="white" strokeWidth="2"/>
        <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2"/>
        <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
      </svg>
    </div>
  );
}

interface Submission {
  title: string;
  date: string;
  views: string;
  bedDropStatus?: string;
  bountyLine: string;
  monetisationLine: string;
}

function SubmissionCard({ s }: { s: Submission }) {
  return (
    <div
      className="flex gap-4 p-4 rounded-2xl"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: `1px solid ${DIVIDER}`,
      }}
    >
      <InstagramIcon size={40} />
      <div className="flex-1 flex flex-col gap-1 text-[13px]">
        <div className="text-white font-semibold leading-snug">{s.title}</div>
        <div style={{ color: TEXT_MUTED }}>{s.date}</div>
        <div style={{ color: TEXT_MUTED }}>{s.views}</div>
        {s.bedDropStatus && <div style={{ color: TEXT_MUTED }}>{s.bedDropStatus}</div>}
        <div style={{ color: TEXT_MUTED }}>{s.bountyLine}</div>
        <div style={{ color: TEXT_MUTED }}>{s.monetisationLine}</div>
      </div>
    </div>
  );
}

interface Referral {
  handle: string;
  date: string;
  amount: string;
}

function ReferralRow({ r }: { r: Referral }) {
  return (
    <div className="flex items-center justify-between py-4" style={{ borderBottom: `1px solid ${DIVIDER}` }}>
      <div className="flex flex-col gap-1">
        <span className="text-white font-semibold text-[15px]">{r.handle}</span>
        <span className="text-[12px]" style={{ color: TEXT_MUTED }}>{r.date}</span>
      </div>
      <span className="text-[15px] font-semibold tabular-nums" style={{ color: GREEN }}>{r.amount}</span>
    </div>
  );
}

// Sample data matching the mockup
const SAMPLE_SUBMISSIONS: Submission[] = [
  {
    title: "Why I'd choose Zostel Pahalgam for my next trip",
    date: "12 May '26",
    views: '6000 views',
    bedDropStatus: '1 Bed Drop - Expired',
    bountyLine: 'Bounty - Zo Credits. 1600',
    monetisationLine: 'Monetisation - Rs. 10,000',
  },
  {
    title: "Why I'd choose Zostel Pahalgam for my next trip",
    date: "12 May '26",
    views: '6000 views',
    bedDropStatus: '1 Bed Drop - Expired',
    bountyLine: 'Bounty - Rs. 1600',
    monetisationLine: 'Monetisation - Rs. 10,000',
  },
];

const SAMPLE_REFERRALS: Referral[] = [
  { handle: 'asim.zo', date: '12/12/12', amount: '+50' },
  { handle: 'coco.zo', date: '12/12/12', amount: '+50' },
  { handle: 'lobo.zo', date: '12/12/12', amount: '+50' },
];

export default function EarningsPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { profile } = useProfile();
  const { myXp } = useMyXp();
  const [mapOpen, setMapOpen] = useState(false);

  // URL handle is the canonical one (no `.zo` suffix). Display drops it too.
  const rawQueryHandle = typeof router.query.handle === 'string' ? router.query.handle : undefined;
  const queryHandle = rawQueryHandle?.replace(/\.zo$/i, '');
  const myHandle = (profile?.nickname || profile?.custom_nickname)?.replace(/\.zo$/i, '');
  const displayHandle = queryHandle || myHandle;
  const isOwnPage = myHandle && queryHandle && myHandle.toLowerCase() === queryHandle.toLowerCase();

  return (
    <>
      <Head>
        <title>Earnings Dashboard · Zo World</title>
      </Head>

      <main
        className="relative min-h-screen w-full"
        style={{
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          // Dark purple base — matches Creator Pass void, with a subtle
          // radial glow bias so the surface feels lit rather than flat.
          background:
            'radial-gradient(ellipse at 50% 30%, #1A0033 0%, #0A0012 55%, #050008 100%)',
        }}
      >
        {/* Warp shader — Creator Pass pink/purple liquid flow, fullscreen. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0"
          style={{ zIndex: 0 }}
        >
          <Warp
            colors={WARP_COLORS}
            speed={0.35}
            scale={1}
            shape="edge"
            shapeScale={0.5}
            distortion={0.5}
            swirl={0.7}
            swirlIterations={10}
            proportion={0.45}
            softness={0.9}
            fit="cover"
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Subtle vignette for depth — keeps edges from feeling flat */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)',
            zIndex: 0,
          }}
        />
        {/* Content wrapper lifts above the shader */}
        <div className="relative" style={{ zIndex: 1 }}>
        {/* Global HUD — left: back + page title + RankPill. Top-right: NavMenuPill. */}
        <PageHeaderPill title="Dashboard" />
        <TopBar
          xp={myXp?.xp ?? 0}
          rank={myXp?.rank ?? 0}
          avatarUrl={profile?.pfp_image || profile?.avatar?.image}
          onOpenSettings={() => router.push('/passport?settings=profile')}
          handle={displayHandle}
          onOpenMap={() => setMapOpen(true)}
        />

        <div className="px-6 md:px-10 pt-24 md:pt-28 pb-16 md:pr-32">
          {/* Top summary card */}
          <section className="rounded-3xl p-6 md:p-10 mb-8" style={CARD_GLASS}>
            <div className="flex flex-wrap gap-10 md:gap-16">
              <div className="flex flex-col gap-2">
                <span className="text-[11px]" style={{ color: TEXT_MUTED }}>Earnings</span>
                <span className="text-white text-[28px] font-semibold tabular-nums">₹1200</span>
                {isOwnPage && (
                  <button
                    type="button"
                    className="text-[13px] font-medium text-left hover:underline"
                    style={{ color: GREEN }}
                    onClick={() => {
                      // TODO: wire to withdrawal flow via zoServer
                      alert('Withdrawal flow coming soon');
                    }}
                  >
                    withdraw to Bank
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[11px]" style={{ color: TEXT_MUTED }}>Quests done</span>
                <span className="text-white text-[28px] font-semibold tabular-nums">24</span>
              </div>
            </div>
          </section>

          {/* Two-column: Creator + Affiliate */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Creator Dashboard */}
            <section className="rounded-3xl p-6 md:p-10" style={CARD_GLASS}>
              <h2 className="text-white text-[18px] font-semibold mb-8">Creator Dashboard</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                <Stat label="Creator Monetization" value="₹800" />
                <Stat label="Bed Drops" value="12" />
                <Stat label="Bounty" value="4500" />
                <Stat label="Total Views" value="4.5M" />
              </div>

              <div>
                <h3 className="text-white text-[15px] font-medium text-center mb-4">Submissions</h3>
                <div className="flex flex-col gap-4">
                  {SAMPLE_SUBMISSIONS.map((s, i) => (
                    <SubmissionCard key={i} s={s} />
                  ))}
                </div>
              </div>
            </section>

            {/* Affiliate Dashboard */}
            <section className="rounded-3xl p-6 md:p-10" style={CARD_GLASS}>
              <h2 className="text-white text-[18px] font-semibold mb-8">Affiliate Dashboard</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                <Stat label="Earnings" value="₹800" />
                <Stat label="Bookings" value="12" />
                <Stat label="Conversion" value="2.4%" />
                <Stat label="Passport Unlocks" value="12" />
              </div>

              <div className="flex flex-col gap-1 mb-4">
                <span className="text-[11px]" style={{ color: TEXT_MUTED }}>Affiliate Dashboard</span>
                <span className="text-white text-[16px] font-semibold">You have Unlocked 14 Passports</span>
              </div>

              <div className="flex gap-10 mb-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px]" style={{ color: TEXT_MUTED }}>Affiliate Earnings</span>
                  <span className="text-white text-[20px] font-semibold tabular-nums">₹400</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px]" style={{ color: TEXT_MUTED }}>Bookings</span>
                  <span className="text-white text-[20px] font-semibold tabular-nums">2</span>
                </div>
              </div>

              <div className="flex flex-col">
                {SAMPLE_REFERRALS.map((r, i) => (
                  <ReferralRow key={i} r={r} />
                ))}
              </div>
            </section>
          </div>

          {/* Locked-state hint if not logged in */}
          {!isLoggedIn && (
            <div className="mt-8 text-center text-[13px]" style={{ color: TEXT_MUTED }}>
              Showing sample data. Log in to see your actual earnings.
            </div>
          )}
        </div>
        </div>

        <MapModal open={mapOpen} onClose={() => setMapOpen(false)} />
      </main>
    </>
  );
}
