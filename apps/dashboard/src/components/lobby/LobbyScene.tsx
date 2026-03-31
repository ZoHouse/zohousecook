import React, { useState } from 'react';
import { useProfile } from '@zo/auth';
import { AvatarConfig } from '@zo/avatar-renderer';
import { toast } from 'sonner';
import cn from '../../utils/cn';
import { useAvatarConfig } from '../../hooks/useAvatarConfig';
import { AvatarDisplay } from './AvatarDisplay';
import { AvatarEditor } from './AvatarEditor';

/** Resolve auth token from localStorage. Tries zo-admin first (zozozo.work), then zo-web. */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('zo-admin-token') ||
    localStorage.getItem('zo-web-token') ||
    null
  );
}

export function LobbyScene() {
  const { profile } = useProfile();
  const { config, setConfig, saveConfig, hasCustomAvatar, isLoading } =
    useAvatarConfig();
  const [editorOpen, setEditorOpen] = useState(false);

  const name =
    profile?.nickname || profile?.custom_nickname || 'New Citizen';
  const culture = profile?.culture ?? null;

  const handleSave = async (newConfig: AvatarConfig, svgBlob: Blob) => {
    // 1. Upload SVG blob to profile asset endpoint
    const token = getAuthToken();
    const appId = process.env.APP_ID || '';
    const apiBase = process.env.API_BASE_URL || 'https://api.io.zo.xyz';

    const formData = new FormData();
    formData.append('file', svgBlob, 'zobu.svg');

    try {
      const res = await fetch(
        `${apiBase}/profile/api/v1/me/assets/1/upload/`,
        {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(appId ? { 'Client-App-Id': appId } : {}),
          },
          body: formData,
        }
      );

      if (!res.ok) {
        toast.error('Avatar upload failed — please try again.');
        return;
      }
    } catch {
      toast.error('Avatar upload failed — please check your connection.');
      return;
    }

    // 2. Save config to profile
    try {
      await saveConfig(newConfig);
      setConfig(newConfig);
      setEditorOpen(false);
      toast.success('Zobu saved!');
    } catch {
      toast.error('Failed to save avatar config.');
    }
  };

  // Loading skeleton
  if (isLoading || !config) {
    return (
      <div className="pointer-events-auto flex flex-col items-center gap-3">
        <div
          className="animate-pulse bg-white/5 rounded-dash-lg"
          style={{ width: 300, height: 300 }}
        />
        <div className="animate-pulse bg-white/5 rounded-dash-pill h-8 w-40" />
      </div>
    );
  }

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-3">
      {/* Avatar */}
      <AvatarDisplay
        config={config}
        size={300}
        onClick={() => setEditorOpen(true)}
      />

      {/* Name pill */}
      <div
        className={cn(
          'flex items-center gap-2 px-dash-lg py-dash-sm',
          'bg-dash-bg backdrop-blur-dash-md border border-dash-border',
          'rounded-dash-pill shadow-dash-card'
        )}
      >
        <span className="text-dash-text font-semibold text-sm">{name}</span>
        {culture && (
          <>
            <span className="text-dash-text-40 text-xs">·</span>
            <span className="text-dash-text-50 text-xs capitalize">
              {culture}
            </span>
          </>
        )}
      </div>

      {/* CTA for first-time users */}
      {!hasCustomAvatar && (
        <button
          onClick={() => setEditorOpen(true)}
          className={cn(
            'px-dash-lg py-dash-sm text-sm font-medium rounded-dash-pill transition-colors',
            'bg-dash-accent text-black hover:opacity-90'
          )}
        >
          Customise your Zobu
        </button>
      )}

      {/* Editor modal */}
      {editorOpen && (
        <AvatarEditor
          initialConfig={config}
          onSave={handleSave}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
