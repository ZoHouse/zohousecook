import { useState, useEffect, useCallback, useRef } from 'react';
import { useJanus } from './useJanus';

export interface AudioPeer {
  id: number;
  display: string; // user code
  muted: boolean;
  talking: boolean;
}

interface UseAudioBridgeProps {
  roomId: string | null;
  userCode: string | null;
  displayName: string | null;
  autoJoin?: boolean;
}

export function useAudioBridge({ roomId, userCode }: UseAudioBridgeProps) {
  const {
    sessionId, isConnected: janusConnected,
    connect, disconnect: janusDisconnect,
    sendMessage, registerCallback,
  } = useJanus();

  const [handleId, setHandleId] = useState<number | null>(null);
  const [peers, setPeers] = useState<AudioPeer[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [wantsToJoin, setWantsToJoin] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Attach AudioBridge plugin
  const attachPlugin = useCallback(() => {
    if (!sessionId) return;
    sendMessage(
      { janus: 'attach', session_id: sessionId, plugin: 'janus.plugin.audiobridge' },
      (response) => {
        if (response.janus === 'success' && response.data?.id) {
          setHandleId(response.data.id);
        }
      }
    );
  }, [sessionId, sendMessage]);

  // Send plugin message
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendPluginMessage = useCallback((body: Record<string, any>, jsep?: any) => {
    if (!sessionId || !handleId) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = { janus: 'message' as const, session_id: sessionId, handle_id: handleId, body } as any;
    if (jsep) msg.jsep = jsep;

    sendMessage(msg, (response) => {
      if (response.jsep && pcRef.current) {
        pcRef.current.setRemoteDescription(new RTCSessionDescription(response.jsep));
      }
      if (response.plugindata?.data?.participants) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPeers(response.plugindata.data.participants.map((p: any) => ({
          id: p.id, display: p.display, muted: p.muted, talking: false,
        })));
      }
    });
  }, [sessionId, handleId, sendMessage]);

  // Handle plugin events
  useEffect(() => {
    if (!handleId) return;
    return registerCallback(`plugin_${handleId}`, (msg) => {
      const event = msg.plugindata?.data;
      if (!event) return;

      if (event.audiobridge === 'talking' || event.audiobridge === 'stopped-talking') {
        const talking = event.audiobridge === 'talking';
        setPeers((prev) => prev.map((p) => (p.id === event.id ? { ...p, talking } : p)));
      }

      if (event.audiobridge === 'joined' || event.audiobridge === 'event') {
        if (event.participants) {
          setPeers((prev) => {
            const existing = new Set(prev.map((p) => p.id));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newPeers = event.participants.filter((p: any) => !existing.has(p.id)).map((p: any) => ({
              id: p.id, display: p.display, muted: p.muted, talking: false,
            }));
            return [...prev, ...newPeers];
          });
        }
        if (event.leaving) {
          setPeers((prev) => prev.filter((p) => p.id !== event.leaving));
        }
      }
    });
  }, [handleId, registerCallback]);

  // Join audio room
  const joinRoom = useCallback(async () => {
    if (!roomId || !handleId || !userCode) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      pcRef.current = pc;

      stream.getTracks().forEach((track) => { pc.addTrack(track, stream); track.enabled = false; });

      pc.ontrack = (event) => {
        const audio = document.createElement('audio');
        audio.srcObject = event.streams[0];
        audio.autoplay = true;
        audio.id = 'janus-remote-audio';
        // Remove existing before adding
        document.getElementById('janus-remote-audio')?.remove();
        document.body.appendChild(audio);
      };

      pc.onnegotiationneeded = async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendPluginMessage(
          {
            request: 'join', room: roomId,
            id: Math.floor(Math.random() * 1000000),
            display: userCode, pin: '1234',
            muted: true, codec: 'opus', quality: 4, volume: 100,
          },
          { type: 'offer', sdp: offer.sdp }
        );
      };

      pc.onicecandidate = (event) => {
        sendMessage({
          janus: 'trickle', session_id: sessionId!, handle_id: handleId,
          candidate: event.candidate || { completed: true },
        });
      };

      setIsActive(true);
      setIsMuted(true);
    } catch (err) {
      console.error('Failed to get microphone:', err);
    }
  }, [roomId, handleId, userCode, sessionId, sendMessage, sendPluginMessage]);

  // Leave audio room
  const leaveRoom = useCallback(() => {
    sendPluginMessage({ request: 'leave' });
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    document.getElementById('janus-remote-audio')?.remove();
    setPeers([]);
    setIsActive(false);
    setIsMuted(true);
  }, [sendPluginMessage]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!streamRef.current) return;
    const newMuted = !isMuted;
    streamRef.current.getAudioTracks().forEach((track) => { track.enabled = !newMuted; });
    sendPluginMessage({ request: 'configure', muted: newMuted });
    setIsMuted(newMuted);
  }, [isMuted, sendPluginMessage]);

  // Auto-attach plugin when session ready
  useEffect(() => {
    if (sessionId && !handleId) attachPlugin();
  }, [sessionId, handleId, attachPlugin]);

  // Auto-join room when handle is ready and user clicked "Join Voice"
  useEffect(() => {
    if (wantsToJoin && handleId && roomId && userCode && !isActive) {
      joinRoom();
    }
  }, [wantsToJoin, handleId, roomId, userCode, isActive, joinRoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      document.getElementById('janus-remote-audio')?.remove();
    };
  }, []);

  const speakingMap = peers.reduce<Record<string, boolean>>((acc, p) => {
    acc[p.display] = p.talking;
    return acc;
  }, {});

  // One-click: connect Janus + signal intent to join
  const startVoice = useCallback(() => {
    setWantsToJoin(true);
    connect();
  }, [connect]);

  // Override leaveRoom to also clear intent
  const leave = useCallback(() => {
    setWantsToJoin(false);
    leaveRoom();
  }, [leaveRoom]);

  return {
    isActive, isMuted, peers, speakingMap, janusConnected,
    startVoice, leaveRoom: leave, toggleMute,
  };
}
