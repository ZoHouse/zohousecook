import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useProfile } from '@zo/auth';
import { Warp } from '@paper-design/shaders-react';
import { useMyXp } from '../../hooks/useMyXp';
import { useMyRoles } from '../../hooks/useMyRoles';
import { BadgesSection } from '../../components/passport-lobby/BadgesSection';
import { SideNavRail } from '../../components/passport-lobby/SideNavRail';
import { MapModal } from '../../components/passport-lobby/MapModal';
import { TopBar } from '../../components/passport-lobby/TopBar';
import { PageHeaderPill } from '../../components/passport-lobby/PageHeaderPill';

/**
 * Badges page — surfaced at /@{handle}/badges via next.config rewrite.
 * Orange Warp = achievement/fire palette, matches the Warp family used on
 * /earnings (Creator purple) and /quests (treasure amber).
 */

const TEXT_MUTED = '#9CA3AF';

// Ember orange palette — void through burnt rust to peach highlight. Sits in
// the same family as the amber /quests Warp but pushed warmer and more
// saturated so badges read as the distinct "fire earned" surface.
const WARP_COLORS = [
  '#080200',
  '#1F0700',
  '#4D1700',
  '#A32E05',
  '#E94E0F',
  '#FF8534',
  '#FFD0A8',
  '#1F0700',
];

export default function BadgesPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const { myXp } = useMyXp();
  const { roles, isLoading: rolesLoading } = useMyRoles();
  const [mapOpen, setMapOpen] = useState(false);

  const rawQueryHandle = typeof router.query.handle === 'string' ? router.query.handle : undefined;
  const queryHandle = rawQueryHandle?.replace(/\.zo$/i, '');
  const myHandle = (profile?.nickname || profile?.custom_nickname)?.replace(/\.zo$/i, '');
  const displayHandle = queryHandle || myHandle;

  // Memoize the shader background so XP/roles data loads don't remount the
  // WebGL canvas — that was the source of the flicker on this page.
  const backgroundShader = useMemo(
    () => (
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
        <Warp
          colors={WARP_COLORS}
          speed={0.3}
          scale={1}
          shape="edge"
          shapeScale={0.5}
          distortion={0.5}
          swirl={0.6}
          swirlIterations={10}
          proportion={0.5}
          softness={0.9}
          fit="cover"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    ),
    [],
  );

  return (
    <>
      <Head>
        <title>Badges · Zo World</title>
      </Head>

      <main
        className="relative min-h-screen w-full"
        style={{
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#080200',
        }}
      >
        {backgroundShader}

        {/* Global HUD — left: back + page title, right: RankPill, below right: nav rail. */}
        <PageHeaderPill title="Badges" />
        <TopBar xp={myXp?.xp ?? 0} rank={myXp?.rank ?? 0} avatarUrl={profile?.pfp_image || profile?.avatar?.image} />
        {/* SideNavRail self-positions globally (same slot on every page) */}
        <SideNavRail handle={displayHandle} onOpenMap={() => setMapOpen(true)} />

        <div
          className="relative pt-24 md:pt-28"
          style={{
            zIndex: 1,
            // Promote the content lane to its own compositor layer so the
            // Warp shader behind cannot drag card/GIF repaints into its
            // frame loop. Without this the country-card GIFs visibly flicker
            // because they end up sharing a paint layer with the shader.
            isolation: 'isolate',
            transform: 'translateZ(0)',
            willChange: 'transform',
          }}
        >

          <div className="px-6 md:px-10 pb-24 md:pr-32 max-w-[720px] mx-auto">
            <h1 className="text-white text-[24px] font-semibold mb-1">Badges</h1>
            <p className="text-[13px] mb-8" style={{ color: TEXT_MUTED }}>
              Earned through your journey in Zo World
            </p>
            <BadgesSection
              roles={roles}
              rolesLoading={rolesLoading}
              myXp={myXp}
              profile={profile}
              onBack={() => router.push('/passport')}
              embedded
            />
          </div>
        </div>

        <MapModal open={mapOpen} onClose={() => setMapOpen(false)} />
      </main>
    </>
  );
}
