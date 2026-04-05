import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useProfile } from '@zo/auth';
import { toast } from 'sonner';
import { useAvatarSeed } from '../../hooks/useAvatarSeed';
import { fetchSvgContent, ZobuConfig, ZobuLayer } from './AvatarDisplay';
import { AvatarEditor } from './AvatarEditor';
import { usePedestalSlots } from '../../hooks/usePedestalSlots';
import type { RoomMember } from '../../hooks/useRoom';

// Dynamic import — Three.js cannot SSR
// Single dynamic boundary: LobbyView bundles Canvas + Scene so no next/dynamic
// wrapper ends up inside the R3F reconciler (which breaks Three.js rendering).
import dynamic from 'next/dynamic';
const LobbyView = dynamic(() => import('./LobbyView'), { ssr: false });

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

  const slots = usePedestalSlots(members, selfCode);

  // Load default Zobu (base only) once seed is available
  useEffect(() => {
    if (!seed || zobuConfig) return;
    const base = seed.bases[0];
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
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse bg-white/5 rounded-dash-lg" style={{ width: 200, height: 400 }} />
      </div>
    );
  }

  return (
    <>
      {/* 3D Canvas fills parent container */}
      <div
        className="w-full h-full cursor-pointer"
        onClick={() => setEditorOpen(true)}
      >
        <LobbyView slots={slots} speakingMap={speakingMap} />
      </div>

      {/* Editor modal — stays as HTML overlay */}
      {editorOpen && (
        <AvatarEditor
          onSave={handleSave}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </>
  );
}
