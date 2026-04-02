import { useState, useEffect, useCallback, useRef } from 'react';
import { useProfile } from '@zo/auth';

const LOBBY_API_BASE = 'https://api.zostel.com';
const LOBBY_SOCKET_BASE = 'wss://socket.zo.xyz/';

export interface RoomMember {
  code: string;
  nickname: string;
  avatar_url: string;
  bio?: string;
  status?: string;
}

interface SocketMessage {
  action: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>;
  action_user?: unknown;
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zo-admin-token') || localStorage.getItem('zo-web-token') || null;
}

function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  const appId = process.env.APP_ID || '';
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (appId) headers['Client-App-Id'] = appId;
  if (typeof window === 'undefined') return headers;

  // Device headers (set during auth login)
  const prefix = localStorage.getItem('zo-admin-token') ? 'zo-admin' : 'zo-web';
  const deviceId = localStorage.getItem(`${prefix}-device-id`);
  const deviceSecret = localStorage.getItem(`${prefix}-device-secret`);
  if (deviceId) headers['Client-Device-Id'] = deviceId;
  if (deviceSecret) headers['Client-Device-Secret'] = deviceSecret;

  // User ID from stored user object
  try {
    const userStr = localStorage.getItem(`${prefix}-user`);
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.id) headers['Client-User-Id'] = String(user.id);
    }
  } catch { /* ignore */ }

  return headers;
}

/**
 * @param slug — if provided, joins another user's room (visitor mode).
 *               If omitted, loads your own room.
 */
export function useRoom(slug?: string) {
  const { profile } = useProfile();
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [socketRoute, setSocketRoute] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [roomData, setRoomData] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roomName, setRoomName] = useState<string | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();
  const reconnectDelay = useRef(2000);
  const fetchedRef = useRef(false);

  // Fetch room info from zostel API
  useEffect(() => {
    if (!profile?.code || fetchedRef.current) return;
    fetchedRef.current = true;

    const endpoint = slug
      ? `${LOBBY_API_BASE}/profile/api/v1/profile/lobby/${slug}/`
      : `${LOBBY_API_BASE}/profile/api/v1/me/lobby/`;

    (async () => {
      try {
        const res = await fetch(endpoint, { headers: getAuthHeaders() });
        if (!res.ok) { setIsLoading(false); return; }
        const data = await res.json();

        setRoomData(data.profile || data.room || data);
        setMembers(data.members || []);
        setRoomName(data.profile?.lobby_name || data.room?.name || slug || null);

        if (data.socket?.path) {
          setSocketRoute(data.socket.path);
          socketTokenRef.current = data.socket.token || null;
        }
        if (data.profile?.code || data.room?.code) {
          setRoomCode(data.profile?.code || data.room?.code);
        }
      } catch {
        // lobby API unavailable
      } finally {
        setIsLoading(false);
      }
    })();
  }, [profile?.code, slug]);

  // Direct WebSocket to socket.zo.xyz
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketTokenRef = useRef<string | null>(null);

  // Connect WebSocket once we have the route
  useEffect(() => {
    if (!socketRoute) return;

    const connectSocket = () => {
      const url = `${LOBBY_SOCKET_BASE}${socketRoute}${socketTokenRef.current ? '?' + socketTokenRef.current : ''}`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectDelay.current = 2000;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data)) {
            data.forEach((d) => handleMessage(d));
          } else {
            handleMessage(data);
          }
        } catch { /* ignore */ }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeout.current = setTimeout(() => {
          connectSocket();
          reconnectDelay.current = Math.min(reconnectDelay.current * 2, 10000);
        }, reconnectDelay.current);
      };

      ws.onerror = () => {
        ws.close();
      };

      socketRef.current = ws;
    };

    connectSocket();

    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [socketRoute]);

  // Handle incoming messages
  const handleMessage = useCallback((message: SocketMessage) => {
    const { action, payload } = message;

    switch (action) {
      case 'joined':
        setMembers((prev) => {
          const member = payload as unknown as RoomMember;
          if (prev.find((m) => m.code === member.code)) return prev;
          return [...prev, member];
        });
        break;

      case 'left':
        setMembers((prev) =>
          prev.filter((m) => m.code !== payload.code)
        );
        break;

      case 'member_update_avatar':
        setMembers((prev) =>
          prev.map((m) =>
            m.code === payload.code
              ? { ...m, avatar_url: payload.avatar_url }
              : m
          )
        );
        break;

      case 'member_kick':
        setMembers((prev) =>
          prev.filter((m) => m.code !== payload.code)
        );
        break;

      case 'update_background':
        setRoomData((prev) =>
          prev ? { ...prev, background_key: payload.background } : prev
        );
        break;

      case 'update_music':
        setRoomData((prev) =>
          prev ? { ...prev, music_key: payload.music } : prev
        );
        break;
    }
  }, []);

  const sendMessage = useCallback(
    (action: string, payload: Record<string, unknown>) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ action, payload }));
      }
    },
    []
  );

  const isHost = !!(
    profile?.code &&
    roomData &&
    Array.isArray(roomData.hosts) &&
    roomData.hosts.includes(profile.code)
  );

  return {
    members,
    roomData,
    roomCode,
    roomName,
    isConnected,
    isHost,
    isLoading,
    sendMessage,
    profile,
  };
}
