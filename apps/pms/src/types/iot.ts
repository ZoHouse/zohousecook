export interface IoTCamera {
  id: string;
  operator_code: string;
  name: string;
  location: string | null;
  floor: string | null;
  type: 'indoor' | 'outdoor' | 'entrance';
  provider: 'ezviz' | 'tapo';
  relay_url: string | null;
  go2rtc_name: string | null;
  status: 'online' | 'offline';
  is_featured: boolean;
  last_seen_at: string | null;
}

export function buildSnapshotUrl(relayUrl: string, streamName: string, cacheBust?: number): string {
  const base = relayUrl.endsWith('/') ? relayUrl : `${relayUrl}/`;
  return `${base}api/frame.jpeg?src=${encodeURIComponent(streamName)}${cacheBust ? `&t=${cacheBust}` : ''}`;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  function_calls?: FunctionCallResult[];
}

export interface FunctionCallResult {
  name: string;
  result: Record<string, unknown>;
}

export interface HouseStatus {
  online: boolean;
  cameras: { total: number; online: number };
  screens: { total: number; online: number };
  lights: { total: number; online: number };
  locks: { total: number; locked: number };
}

export type WLEDPreset = 'social' | 'focus' | 'party' | 'calm' | 'night' | 'off';
