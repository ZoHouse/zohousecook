import { useEffect, useState } from 'react';
import { useProfile } from '@zo/auth';
import { AvatarConfig, BodyType, generateRandomAvatar } from '@zo/avatar-renderer';

interface UseAvatarConfigReturn {
  config: AvatarConfig | null;
  setConfig: (config: AvatarConfig) => void;
  saveConfig: (newConfig: AvatarConfig) => Promise<void>;
  saving: boolean;
  hasCustomAvatar: boolean;
  isLoading: boolean;
}

export function useAvatarConfig(): UseAvatarConfigReturn {
  const { profile, updateProfile, isLoading } = useProfile();
  const [config, setConfig] = useState<AvatarConfig | null>(null);
  const [hasCustomAvatar, setHasCustomAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // If profile has an avatar_config, use it
    if (profile?.avatar_config) {
      try {
        const parsed: AvatarConfig =
          typeof profile.avatar_config === 'string'
            ? JSON.parse(profile.avatar_config)
            : profile.avatar_config;
        setConfig(parsed);
        setHasCustomAvatar(true);
        return;
      } catch {
        // fall through to random
      }
    }

    // Fall back to a random avatar, using body_type from profile if available
    const bodyType: BodyType =
      profile?.body_type === 'baes' ? 'baes' : 'bros';
    setConfig(generateRandomAvatar(bodyType));
    setHasCustomAvatar(false);
  }, [isLoading, profile?.avatar_config, profile?.body_type]);

  const saveConfig = (newConfig: AvatarConfig): Promise<void> => {
    return new Promise((resolve, reject) => {
      setSaving(true);
      updateProfile(
        { data: { avatar_config: newConfig } },
        {
          onSuccess: () => {
            setSaving(false);
            resolve();
          },
          onError: (err: unknown) => {
            setSaving(false);
            reject(err);
          },
        }
      );
    });
  };

  return { config, setConfig, saveConfig, saving, hasCustomAvatar, isLoading };
}
