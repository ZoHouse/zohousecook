import { useState, useEffect } from 'react';

export interface AvatarAsset {
  id: number;
  name: string;
  file: string;
  cropped_file: string;
  bases: number[];
}

export interface AvatarCategory {
  id: number;
  name: string;
  order: number;
  display_order?: number;
  file: string;
  assets: AvatarAsset[];
}

export interface AvatarBase {
  id: number;
  name: string;
  file: string;
}

export interface AvatarSeed {
  categories: AvatarCategory[];
  bases: AvatarBase[];
}

const SEED_URL = 'https://api.zostel.com/profile/api/v1/avatar/seed/';
const APP_ID = 'Ne0HsSgWroMJkV9JQBpWd7ZdGIqARRnKeSYhRdVU';

let cachedSeed: AvatarSeed | null = null;

/**
 * Fetches the full-body Zobu avatar seed (categories, bases, assets) from the Zo World API.
 * Cached globally — only fetched once per session.
 */
export function useAvatarSeed() {
  const [seed, setSeed] = useState<AvatarSeed | null>(cachedSeed);
  const [loading, setLoading] = useState(!cachedSeed);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedSeed) return;

    fetch(SEED_URL, {
      headers: { 'Client-App-Id': APP_ID },
    })
      .then((res) => res.json())
      .then((data) => {
        const avatarSeed: AvatarSeed = {
          categories: data.avatar.categories,
          bases: data.avatar.bases,
        };
        cachedSeed = avatarSeed;
        setSeed(avatarSeed);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { seed, loading, error };
}
