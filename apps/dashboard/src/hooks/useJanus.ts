import { useState, useEffect, useCallback, useRef } from 'react';

const JANUS_SOCKET_URL = 'wss://av.io.zo.xyz/socket';
const JANUS_TOKEN_URL = 'https://zo.xyz/janus/auth/token/';
const KEEPALIVE_INTERVAL = 25000;

function randomString(len: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < len; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface JanusMessage { janus: string; transaction?: string; session_id?: number; sender?: number; [key: string]: any; }
type MessageCallback = (msg: JanusMessage) => void;

export function useJanus() {
  const socketRef = useRef<WebSocket | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef<Record<string, MessageCallback>>({});
  const keepaliveRef = useRef<ReturnType<typeof setInterval>>();
  const tokenRef = useRef<string | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch(JANUS_TOKEN_URL);
      if (res.ok) {
        const data = await res.json();
        tokenRef.current = data.token || data.data?.token || null;
      }
    } catch {
      // Token is optional
    }
  }, []);

  const sendMessage = useCallback((msg: JanusMessage, callback?: MessageCallback) => {
    const transaction = msg.transaction || randomString(12);
    const fullMsg = { ...msg, transaction };
    if (callback) callbacksRef.current[transaction] = callback;
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(fullMsg));
    }
    return transaction;
  }, []);

  const createSession = useCallback(() => {
    sendMessage({ janus: 'create' }, (response) => {
      if (response.janus === 'success' && response.data?.id) {
        setSessionId(response.data.id);
      }
    });
  }, [sendMessage]);

  const connect = useCallback(async () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    await fetchToken();
    const ws = new WebSocket(JANUS_SOCKET_URL, 'janus-protocol');
    socketRef.current = ws;

    ws.onopen = () => { setIsConnected(true); createSession(); };

    ws.onmessage = (event) => {
      try {
        const msg: JanusMessage = JSON.parse(event.data);
        if (msg.transaction && callbacksRef.current[msg.transaction]) {
          callbacksRef.current[msg.transaction](msg);
          if (msg.janus !== 'ack') delete callbacksRef.current[msg.transaction];
        }
        if (msg.sender) {
          const pluginKey = `plugin_${msg.sender}`;
          if (callbacksRef.current[pluginKey]) callbacksRef.current[pluginKey](msg);
        }
      } catch { /* ignore */ }
    };

    ws.onclose = () => { setIsConnected(false); setSessionId(null); };
  }, [fetchToken, createSession]);

  useEffect(() => {
    if (sessionId && socketRef.current?.readyState === WebSocket.OPEN) {
      keepaliveRef.current = setInterval(() => {
        sendMessage({ janus: 'keepalive', session_id: sessionId });
      }, KEEPALIVE_INTERVAL);
    }
    return () => { if (keepaliveRef.current) clearInterval(keepaliveRef.current); };
  }, [sessionId, sendMessage]);

  const disconnect = useCallback(() => {
    if (keepaliveRef.current) clearInterval(keepaliveRef.current);
    if (sessionId) sendMessage({ janus: 'destroy', session_id: sessionId });
    socketRef.current?.close();
    socketRef.current = null;
    setSessionId(null);
    setIsConnected(false);
  }, [sessionId, sendMessage]);

  const registerCallback = useCallback((key: string, cb: MessageCallback) => {
    callbacksRef.current[key] = cb;
    return () => { delete callbacksRef.current[key]; };
  }, []);

  return { sessionId, isConnected, connect, disconnect, sendMessage, registerCallback, token: tokenRef.current };
}
