import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useProfile } from '@zo/auth';
import { MeshGradient } from '@paper-design/shaders-react';
import { useMyXp } from '../../hooks/useMyXp';
import { usePassportProfile } from '../../hooks/usePassportProfile';
import { usePassportUnlock } from '../../hooks/usePassportUnlock';
import { useQuests } from '../../hooks/useQuests';
import { useQuestRecommendations } from '../../hooks/useQuestRecommendations';
import { useQuestParticipate } from '../../hooks/useQuestParticipate';
import { useQuestSubmission } from '../../hooks/useQuestSubmission';
import { useSeason } from '../../hooks/useSeason';
import useInstagramConnect from '../../hooks/useInstagramConnect';
import { toast } from 'sonner';

import { TopBar } from './TopBar';
import { SeasonLevelBar } from './SeasonLevelBar';

import { LobbyRoom } from './LobbyRoom';
import { MapModal } from './MapModal';
import { HeroStage } from './HeroStage';
import { TravelersPill } from './TravelersPill';
import { QuestsDock, actionForQuest, type DockQuest } from './QuestsDock';
import { TreasureChestCard } from './TreasureChestCard';
import { UnlimitedAccessCta } from './UnlimitedAccessCta';
import { CameraCaptureModal, type CaptureKind } from './CameraCaptureModal';
import { InstagramConnectModal } from './InstagramConnectModal';
import { SubmitPostUrlModal } from './SubmitPostUrlModal';
import { hasGeomediaData } from '../../data/quests';
import { ProUpsellModal, type ProUpsellFeature } from '../pro';
import { SettingsModal } from '../passport/SettingsModal';
import ShareModal from '../passport/ShareModal';

// White iridescent pearl. A near-white base brushed with soft rose, lilac,
// mint, peach, and sky tints — reads as polished mother-of-pearl / pearl-
// coated lacquer. Slow speed + low distortion keep it glossy, not slimy.
const IRIDESCENT_PEARL_COLORS = [
  '#FBF8F4', // ivory base (the "white")
  '#F2E0EC', // rose pearl
  '#E6D9F2', // lilac iridescence
  '#FFFFFF', // pure white highlight (the catch of light)
  '#DCEDE8', // mint shimmer
  '#F4E8D4', // warm cream
  '#DBE6F2', // sky pearl
  '#FBF8F4', // back to ivory
];

export function PassportLobby() {
  const router = useRouter();
  const { profile } = useProfile();
  const { myXp } = useMyXp();
  const ig = useInstagramConnect();
  const { profile: passportProfile } = usePassportProfile();
  const { season } = useSeason();
  // Fires POST /passport/unlocks/ on first lobby mount when the viewer's
  // passport_unlocked_at is still null. Required before quests/recommendations
  // returns anything (the endpoint 400s otherwise).
  usePassportUnlock();

  const [upsell, setUpsell] = useState<ProUpsellFeature | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [igModalOpen, setIgModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  // Separate state for the quest-triggered share so the modal can render in
  // its streamlined Instagram-only pearl variant without affecting the
  // rank-pill share above (which uses the full multi-target modal).
  const [questShareOpen, setQuestShareOpen] = useState(false);
  // Creator/IG completion loop — paste the published post link as proof.
  const [submitUrlOpen, setSubmitUrlOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<DockQuest | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [chestOpen, setChestOpen] = useState(false);
  const questSubmission = useQuestSubmission(selectedQuest?.slug);
  // Live quests = participations the user already has. Powers QuestsDock too
  // (react-query dedupes the call via shared cache key).
  const { quests: participatedQuests } = useQuests();
  // Recommended quests = matcher output for the viewer's coords. These have
  // no participation yet — clicking one creates the participation server-side
  // via useQuestParticipate, after which it also shows in `participatedQuests`.
  const { quests: recommendedQuests } = useQuestRecommendations();
  const questParticipate = useQuestParticipate();
  // Combined feed for the chest. Participations win on dedup (they carry
  // status / claims data that recommendations don't).
  const liveQuests = useMemo(() => {
    const seen = new Set(participatedQuests.map((q) => q.pid));
    const merged = [...participatedQuests];
    for (const r of recommendedQuests) {
      if (!seen.has(r.pid)) merged.push(r);
    }
    return merged;
  }, [participatedQuests, recommendedQuests]);

  const handle = profile?.custom_nickname || profile?.nickname || 'Citizen';
  const avatarUrl = profile?.pfp_image || profile?.avatar?.image;
  const xpTotal = myXp?.xp ?? 0;
  const rankTitle = myXp?.rankTitle ?? 'Citizen';
  const rank = myXp?.rank ?? 0;

  const openUpsell = (f: ProUpsellFeature) => setUpsell(f);
  const closeUpsell = () => setUpsell(null);

  useEffect(() => {
    if (router.query.settings === 'profile') {
      setSettingsOpen(true);
    }
  }, [router.query.settings]);

  // PassportPitch's "Share Quests" CTA routes to /passport?share=1 so the
  // viewer lands on their own passport with the share sheet already open.
  useEffect(() => {
    if (router.query.share === '1') {
      setShareOpen(true);
    }
  }, [router.query.share]);

  const handleShare = useCallback(() => {
    // Copy link + open the full share modal (IG story, X, copy link etc)
    const url = `${window.location.origin}/@${handle}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Profile link copied!')).catch(() => {});
    setShareOpen(true);
  }, [handle]);

  if (!profile) return null;

  // IG modal "Connect" button → close modal + redirect to Meta OAuth.
  const handleIgConnect = () => {
    setIgModalOpen(false);
    ig.connect();
  };

  // Per-quest action handler — wires the morphed CTA below the avatar to
  // the selected quest's action (IG connect/share / camera capture / external
  // book). Instagram CTA flips on the citizen's OAuth state.
  const questAction = selectedQuest ? actionForQuest(selectedQuest, ig.isConnected) : null;
  // Connected IG quests are at the "Post" step (Link IG → Post → Verify →
  // Reveal → Claim), so the CTA reads "Submit Post" rather than the generic
  // "Share" actionForQuest returns. Local override keeps actionForQuest pure
  // for the standalone /passport/quests button.
  const igConnectedQuest = questAction?.kind === 'instagram' && ig.isConnected;
  const ctaLabel = igConnectedQuest ? 'Submit Post' : questAction?.label;
  const handleQuestAction = () => {
    if (!questAction) return;
    if (questAction.kind === 'instagram') {
      if (ig.isConnected) {
        // IG linked → open the proof-link capture modal (the "Post" step).
        setSubmitUrlOpen(true);
      } else {
        ig.connect();
      }
    } else if (questAction.kind === 'geomedia') {
      setCameraOpen(true);
    } else if (questAction.kind === 'booking' && questAction.href) {
      window.open(questAction.href, '_blank', 'noopener,noreferrer');
    }
  };

  // Camera modal accepts the kinds the selected geomedia quest allows. Only
  // applies on CAS-bound paths where `data` is populated; otherwise default.
  const cameraAllowed: CaptureKind[] =
    selectedQuest && hasGeomediaData(selectedQuest)
      ? selectedQuest.data.geomedia.media_kinds.filter(
          (k): k is CaptureKind => k === 'photo' || k === 'video',
        )
      : ['photo'];

  return (
    <div
      className="min-h-[100svh] md:min-h-screen md:h-auto text-white relative"
      style={{
        // Fallback solid — ivory that matches the shader anchor so the
        // initial paint and out-of-bounds areas don't flash a different colour.
        background: '#FBF8F4',
        // PWA polish: kill the grey tap flash on iOS, cancel rubber-band scroll, and
        // skip the 300ms double-tap-zoom delay so buttons feel native-responsive.
        WebkitTapHighlightColor: 'transparent',
        overscrollBehavior: 'none',
        touchAction: 'manipulation',
      }}
    >
      {/* Iridescent pearl mesh — slow, lacquered, low-distortion so the surface
          reads as glossy automotive paint / mother-of-pearl, not slime. */}
      <div aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
        <MeshGradient
          colors={IRIDESCENT_PEARL_COLORS}
          speed={0.12}
          scale={0.7}
          distortion={0.08}
          swirl={0.1}
          grainMixer={0.04}
          grainOverlay={0.03}
          fit="cover"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      {/* Soft edge fade — almost imperceptibly cools the corners so the
          ivory pearl doesn't blow out at the periphery and the avatar
          stays the focal point. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 42%, rgba(255,255,255,0) 0%, rgba(220,225,235,0.15) 75%, rgba(200,210,225,0.25) 100%)',
          zIndex: 0,
        }}
      />
      {/* Specular highlight — a high-gloss bloom near the top that mimics the
          reflection on lacquered paint / pearl coating. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 60%)',
          zIndex: 0,
        }}
      />

      {/* Mobile + desktop: full-viewport immersive lobby that scrolls when content
          (carousel below CTA) overflows. */}
      <div className="relative z-[1] mx-auto w-full flex flex-col md:block md:max-w-none md:px-0">
        <TopBar
          xp={xpTotal}
          rank={rank}
          avatarUrl={avatarUrl}
          onOpenSettings={() => setSettingsOpen(true)}
          streakCurrent={passportProfile?.streak?.current}
          streakFreezeTokens={passportProfile?.streak?.freeze_tokens}
          handle={handle}
          onOpenMap={() => setMapOpen(true)}
        />

        {/* Season XP meter (L1-L100). Desktop top-left only. Hidden on prod
            until Daya ships v2 (season_level is null in v1 shape). */}
        {passportProfile?.season_level != null && (
          <div className="hidden md:block fixed top-6 left-6 w-[280px] z-[20]">
            <SeasonLevelBar
              level={passportProfile.season_level}
              xpInLevel={passportProfile.season_xp ?? 0}
              seasonKey={season?.key ?? 's1'}
              levelCurve={season?.level_curve}
              rankTitle={passportProfile.rank_title}
            />
          </div>
        )}

        <LobbyRoom
          hero={
            <HeroStage
              citizenProps={{ handle, displayName: handle, avatarUrl, xpTotal, rankTitle, onShare: handleShare }}
            />
          }
          travelersPill={<TravelersPill />}
          ctaMobile={
            questAction ? (
              <UnlimitedAccessCta size="sm" label={ctaLabel} onClick={handleQuestAction} />
            ) : undefined
          }
          ctaDesktop={
            questAction ? (
              <UnlimitedAccessCta label={ctaLabel} onClick={handleQuestAction} />
            ) : undefined
          }
          belowCta={
            <QuestsDock
              selectedQuest={selectedQuest}
              onSelect={setSelectedQuest}
              onOpenChest={() => setChestOpen(true)}
            />
          }
        />

        {/* In-page camera — fires when the morphed CTA is clicked on a
            geomedia quest. Real submit POSTs to the participation endpoint
            once that ships; mock surfaces a toast. */}
        <CameraCaptureModal
          open={cameraOpen}
          allowed={cameraAllowed}
          title={selectedQuest?.title ?? 'Capture'}
          onClose={() => setCameraOpen(false)}
          onCapture={async (file) => {
            if (!selectedQuest) return;
            // Best-effort geolocation — server stores coords as a Point for
            // proof-of-presence. Quests without a radius gate still benefit
            // from the lat/lng, and the submission endpoint accepts the call
            // even when coords are absent, so we resolve to {} on failure.
            const coords = await new Promise<{
              latitude?: number;
              longitude?: number;
            }>((resolve) => {
              if (typeof navigator === 'undefined' || !navigator.geolocation) {
                resolve({});
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (p) =>
                  resolve({
                    latitude: p.coords.latitude,
                    longitude: p.coords.longitude,
                  }),
                () => resolve({}),
                { enableHighAccuracy: true, timeout: 4000, maximumAge: 30_000 },
              );
            });

            try {
              await questSubmission.mutateAsync({ file, ...coords });
              toast.success('Quest submitted — awaiting review');
              setCameraOpen(false);
            } catch (e) {
              const message =
                (e as { response?: { data?: { errors?: string[] } } })?.response
                  ?.data?.errors?.[0] ||
                (e as { message?: string })?.message ||
                'Submission failed — try again';
              toast.error(message);
            }
          }}
        />
      </div>

      <ProUpsellModal feature={upsell} onClose={closeUpsell} />
      <MapModal open={mapOpen} onClose={() => setMapOpen(false)} />
      <TreasureChestCard
        open={chestOpen}
        onClose={() => setChestOpen(false)}
        quests={liveQuests}
        onSelectQuest={async (q) => {
          // If this quest has no participation yet, it came from the
          // recommendations feed — create the participation server-side so
          // it sticks (next /quests/ fetch includes it) before swapping to
          // the panel. Idempotent on the backend; fire-and-forget if it
          // fails so we don't gate the navigation on the network.
          setChestOpen(false);
          setSelectedQuest(q as DockQuest);
          const hasParticipation = (q.participations ?? []).length > 0;
          if (!hasParticipation) {
            try {
              await questParticipate.mutateAsync(q.slug);
            } catch {
              /* soft-fail — panel still renders, retry on next click */
            }
          }
        }}
      />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <InstagramConnectModal open={igModalOpen} onClose={() => setIgModalOpen(false)} onConnect={handleIgConnect} />
      <SubmitPostUrlModal
        open={submitUrlOpen}
        onClose={() => setSubmitUrlOpen(false)}
        onShare={() => setQuestShareOpen(true)}
        questTitle={selectedQuest?.title}
        submitting={questSubmission.isLoading}
        alreadySubmitted={selectedQuest?.participations?.[0]?.status === 'Submitted'}
        initialUrl={selectedQuest?.participations?.[0]?.proof_url || ''}
        onSubmit={async (proofUrl) => {
          if (!selectedQuest) return;
          try {
            await questSubmission.mutateAsync({ proofUrl });
            toast.success('Post submitted — awaiting review');
            setSubmitUrlOpen(false);
          } catch (e) {
            const message =
              (e as { response?: { data?: { errors?: string[] } } })?.response
                ?.data?.errors?.[0] ||
              (e as { message?: string })?.message ||
              'Submission failed — try again';
            toast.error(message);
          }
        }}
      />
      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} handle={handle} avatarUrl={avatarUrl} displayName={handle} />
      <ShareModal
        isOpen={questShareOpen}
        onClose={() => setQuestShareOpen(false)}
        handle={handle}
        avatarUrl={avatarUrl}
        displayName={handle}
        instagramOnly
      />
    </div>
  );
}
