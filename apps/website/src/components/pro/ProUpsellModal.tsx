import Link from 'next/link';
import { Suspense, lazy, useEffect } from 'react';

const Pro3dAvatarPreview = lazy(() => import('./Pro3dAvatarPreview'));

export type ProUpsellFeature =
  | '3d-avatar' | 'dailies' | 'badges'
  | 'quest-pass' | 'earn-pass' | 'create-pass' | 'host-pass';

interface CopyEntry { title: string; description: string }

const COPY: Record<ProUpsellFeature, CopyEntry> = {
  '3d-avatar': { title: 'Unlock your 3D Zobu', description: 'Stand in the lobby as a full 3D character. Coming with Pro.' },
  dailies: { title: 'Daily Quests, incoming', description: 'Earn XP every day with rotating quests. Early access with Pro.' },
  badges: { title: 'Badges, incoming', description: 'Collect proof of what you\'ve done in Zo World. Early access with Pro.' },
  'quest-pass': { title: 'Quest Pass', description: 'Take on big quests, earn bigger rewards. Apply with Pro.' },
  'earn-pass': { title: 'Earn Pass', description: 'Turn your tribe into a paycheck. 8–15% on every booking. Apply with Pro.' },
  'create-pass': { title: 'Creator Pass', description: 'Your content, real places, real money. Apply with Pro.' },
  'host-pass': { title: 'Host Pass', description: 'Open your space as a Zo Node. Keep 85%. Apply with Pro.' },
};

export interface ProUpsellModalProps {
  feature: ProUpsellFeature | null; // null === closed
  onClose: () => void;
}

export function ProUpsellModal({ feature, onClose }: ProUpsellModalProps) {
  useEffect(() => {
    if (!feature) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [feature, onClose]);

  if (!feature) return null;
  const { title, description } = COPY[feature];

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="pro-upsell-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6" onClick={onClose}>
      <div className="max-w-sm w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}>
        {feature === '3d-avatar' && (
          <Suspense fallback={<div className="w-full aspect-[3/4] max-h-[60vh] mb-4 rounded-xl bg-black/40 animate-pulse" />}>
            <Pro3dAvatarPreview />
          </Suspense>
        )}
        <h2 id="pro-upsell-title" className="text-white text-xl font-semibold mb-2">{title}</h2>
        <p className="text-neutral-400 text-sm mb-6">{description}</p>
        <Link href="/pro" className="inline-block px-6 py-3 rounded-full bg-white text-black font-semibold">
          Upgrade to Pro
        </Link>
        <button onClick={onClose} className="block mx-auto mt-3 text-neutral-500 text-xs">Not now</button>
      </div>
    </div>
  );
}
