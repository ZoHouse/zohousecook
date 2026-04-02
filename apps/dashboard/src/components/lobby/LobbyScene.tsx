import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useProfile } from '@zo/auth';
import { toast } from 'sonner';
import cn from '../../utils/cn';
import { useAvatarSeed } from '../../hooks/useAvatarSeed';
import { AvatarDisplay, ZobuConfig, ZobuLayer, fetchSvgContent } from './AvatarDisplay';
import { AvatarEditor } from './AvatarEditor';
import { MemberZobu } from './MemberZobu';
import type { RoomMember } from '../../hooks/useRoom';



interface LobbySceneProps {
  members?: RoomMember[];
  selfCode?: string;
  speakingMap?: Record<string, boolean>;
}

export function LobbyScene({ members = [], selfCode, speakingMap = {} }: LobbySceneProps) {
  const router = useRouter();
  const { profile } = useProfile();
  const { seed, loading: seedLoading } = useAvatarSeed();
  const [editorOpen, setEditorOpen] = useState(false);
  const [zobuConfig, setZobuConfig] = useState<ZobuConfig | null>(null);

  const name = profile?.nickname || profile?.custom_nickname || 'New Citizen';
  const culture = profile?.culture ?? null;

  // Load default Zobu (base only) once seed is available
  useEffect(() => {
    if (!seed || zobuConfig) return;
    const base = seed.bases[0]; // Default to first base (Bro)
    if (!base) return;

    fetchSvgContent(base.file).then(async (baseSvg) => {
      const layers: ZobuLayer[] = seed.categories
        .filter((c) => c.id !== 1)
        .map((c) => ({
          categoryId: c.id,
          order: c.order,
          assetId: null,
          svg: null,
        }));

      // Auto-apply Hand asset (category 9) — always present on every Zobu
      const handCat = seed.categories.find((c) => c.id === 9);
      const handAsset = handCat?.assets[0];
      if (handAsset) {
        const handSvg = await fetchSvgContent(handAsset.file);
        const handLayer = layers.find((l) => l.categoryId === 9);
        if (handLayer) {
          handLayer.assetId = handAsset.id;
          handLayer.svg = handSvg;
        }
      }

      setZobuConfig({ baseId: base.id, baseSvg, layers });
    });
  }, [seed, zobuConfig]);

  const handleSave = async (svgBlob: Blob) => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('zo-admin-token') || localStorage.getItem('zo-web-token')
        : null;

    const formData = new FormData();
    formData.append('file', svgBlob, 'zobu.svg');

    try {
      const { basePath } = router;
      const prefix = localStorage.getItem('zo-admin-token') ? 'zo-admin' : 'zo-web';
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      // Pass user/device info via x- prefixed headers (same-origin, no CORS)
      const deviceId = localStorage.getItem(`${prefix}-device-id`);
      const deviceSecret = localStorage.getItem(`${prefix}-device-secret`);
      if (deviceId) headers['x-client-device-id'] = deviceId;
      if (deviceSecret) headers['x-client-device-secret'] = deviceSecret;
      try {
        const userStr = localStorage.getItem(`${prefix}-user`);
        if (userStr) { const u = JSON.parse(userStr); if (u?.id) headers['x-client-user-id'] = String(u.id); }
      } catch { /* ignore */ }

      const res = await fetch(`${basePath}/api/avatar-upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!res.ok) { toast.error('Avatar upload failed'); return; }
      toast.success('Zobu saved!');
      setEditorOpen(false);
    } catch {
      toast.error('Upload failed — check your connection');
    }
  };

  if (seedLoading) {
    return (
      <div className="pointer-events-auto flex flex-col items-center gap-3">
        <div className="animate-pulse bg-white/5 rounded-dash-lg" style={{ width: 200, height: 400 }} />
      </div>
    );
  }

  // Responsive avatar size — smaller on mobile to match background proportions
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const avatarSize = useMemo(() => (windowWidth < 640 ? 360 : windowWidth < 1024 ? 280 : 400), [windowWidth]);

  // Other members in the room (exclude self)
  const otherMembers = members.filter((m) => m.code !== selfCode).slice(0, 4);

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-3 relative">
      {/* Room members behind the main avatar */}
      {otherMembers.length > 0 && (
        <div className="absolute -top-4 flex items-end gap-2 opacity-90" style={{ zIndex: -1 }}>
          {otherMembers.map((m, i) => (
            <div
              key={m.code}
              style={{
                transform: `translateX(${(i - (otherMembers.length - 1) / 2) * 90}px) scale(0.85)`,
              }}
            >
              <MemberZobu
                avatarUrl={m.avatar_url}
                nickname={m.nickname}
                size={100}
                speaking={speakingMap[m.code]}
              />
            </div>
          ))}
          {members.filter((m) => m.code !== selfCode).length > 4 && (
            <span className="text-[10px] text-dash-text-50 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-dash-pill">
              +{members.filter((m) => m.code !== selfCode).length - 4} more
            </span>
          )}
        </div>
      )}
      <AvatarDisplay
        zobuConfig={zobuConfig}
        size={avatarSize}
        onClick={() => setEditorOpen(true)}
      />

      {/* Editor */}
      {editorOpen && (
        <AvatarEditor
          onSave={handleSave}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
