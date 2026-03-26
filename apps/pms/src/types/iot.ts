export type DeviceCategory = 'camera' | 'screen' | 'light' | 'lock' | 'wifi' | 'power';

export interface IoTDevice {
  id: string;
  operator_code: string;
  category: DeviceCategory;
  name: string;
  location: string | null;
  floor: string | null;
  type: string | null;
  provider: string | null;
  status: 'online' | 'offline';
  is_featured: boolean;
  last_seen_at: string | null;

  // camera
  relay_url: string | null;
  go2rtc_name: string | null;

  // light
  current_preset: string | null;
  brightness: number | null;

  // screen
  content_url: string | null;
  resolution: string | null;

  // lock
  device_ref_id: string | null;
  lock_state: 'locked' | 'unlocked' | null;

  // meta
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Convenience alias for camera-filtered devices */
export type IoTCamera = IoTDevice & { category: 'camera' };

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
  wifi: { total: number; online: number };
  power: { total: number; online: number };
}

export type WLEDPreset = 'social' | 'focus' | 'party' | 'calm' | 'night' | 'off';
