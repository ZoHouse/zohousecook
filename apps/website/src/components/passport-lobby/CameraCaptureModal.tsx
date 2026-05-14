import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { rubikClassName } from '../utils/font';

export type CaptureKind = 'photo' | 'video';

export interface CameraCaptureModalProps {
  open: boolean;
  onClose: () => void;
  /** Which media kinds the quest accepts. Drives the mode toggle. */
  allowed: CaptureKind[];
  /** Called with the captured blob — for the mock we just toast. */
  onCapture?: (file: File) => void;
  /** Optional title shown at the top of the modal. */
  title?: string;
}

type Phase = 'idle' | 'preview' | 'recording' | 'captured' | 'denied' | 'unsupported';

// ─── Pearl-iridescent design tokens (shared across the passport lobby) ────────
const PEARL_BG =
  'linear-gradient(135deg, #FFFFFF 0%, #FBF8F4 40%, #F2E0EC 75%, #DBE6F2 100%)';
const PEARL_SHIMMER =
  'linear-gradient(120deg, rgba(220,237,232,0.45) 0%, rgba(255,255,255,0) 35%, rgba(219,230,242,0.4) 100%)';
const INK = '#0A0A14';
const INK_MUTED = '#6B5B8E';
const GOLD = '#F5C542';
const GOLD_INK = '#3A2900';

const GLASS_PILL: React.CSSProperties = {
  height: 36,
  padding: '0 14px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.78)',
  color: INK,
  fontSize: 13,
  fontWeight: 600,
  border: '1px solid rgba(255,255,255,0.9)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow:
    '0 6px 18px rgba(120,100,160,0.22), inset 0 1px 0 rgba(255,255,255,0.95)',
};

/**
 * In-page camera modal. Streams the device camera into a <video> element via
 * getUserMedia, then snapshots a frame (photo) or records via MediaRecorder
 * (video). All chrome uses the same pearl-iridescent treatment as the lobby
 * quest cards / panel so the modal feels native to the surrounding surface.
 */
export function CameraCaptureModal({
  open,
  onClose,
  allowed,
  onCapture,
  title = 'Capture',
}: CameraCaptureModalProps) {
  const [mode, setMode] = useState<CaptureKind>(allowed[0] ?? 'photo');
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [captured, setCaptured] = useState<{ blob: Blob; url: string; kind: CaptureKind } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startStream = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setPhase('unsupported');
      return;
    }
    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode: { ideal: 'environment' } },
        audio: mode === 'video',
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setPhase('preview');
      setErrorMsg(null);
    } catch (err: unknown) {
      stopStream();
      const e = err as { name?: string; message?: string };
      if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
        setPhase('denied');
      } else {
        setPhase('unsupported');
        setErrorMsg(e.message ?? 'Camera unavailable');
      }
    }
  }, [mode, stopStream]);

  // Open/close + mode-change lifecycle.
  useEffect(() => {
    if (!open) {
      stopStream();
      setCaptured((c) => {
        if (c) URL.revokeObjectURL(c.url);
        return null;
      });
      setPhase('idle');
      return;
    }
    startStream();
    return () => {
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  // ESC closes + lock background scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const snapPhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setCaptured({ blob, url, kind: 'photo' });
      setPhase('captured');
      stopStream();
    }, 'image/jpeg', 0.92);
  };

  const startVideoRecord = () => {
    const stream = streamRef.current;
    if (!stream) return;
    try {
      chunksRef.current = [];
      const rec = new MediaRecorder(stream, { mimeType: 'video/webm' });
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setCaptured({ blob, url, kind: 'video' });
        setPhase('captured');
        stopStream();
      };
      recorderRef.current = rec;
      rec.start();
      setPhase('recording');
    } catch {
      toast.error('Recording not supported in this browser');
    }
  };

  const stopVideoRecord = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
  };

  const retake = () => {
    if (captured) URL.revokeObjectURL(captured.url);
    setCaptured(null);
    startStream();
  };

  const submit = () => {
    if (!captured) return;
    const ext = captured.kind === 'photo' ? 'jpg' : 'webm';
    const file = new File([captured.blob], `quest-${Date.now()}.${ext}`, {
      type: captured.blob.type,
    });
    if (onCapture) onCapture(file);
    else toast.success(`Captured ${captured.kind}. Submission coming once the upload API is wired.`);
    onClose();
  };

  const onShutter = () => {
    if (mode === 'photo') snapPhoto();
    else if (phase === 'recording') stopVideoRecord();
    else startVideoRecord();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`${rubikClassName} fixed inset-0 z-[90] flex flex-col`}
      style={{ background: PEARL_BG, color: INK }}
    >
      {/* Pearl shimmer overlay — matches lobby + quest panels. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: PEARL_SHIMMER, mixBlendMode: 'overlay' }}
      />
      {/* Specular highlight at top — same as the lobby. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 60%)',
        }}
      />

      {/* Top bar — back pill on the left, kicker eyebrow on the right. */}
      <div
        className="relative flex items-center justify-between px-6 md:px-8 pb-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close camera"
          className="inline-flex items-center gap-1.5 transition-transform active:scale-[0.96]"
          style={GLASS_PILL}
        >
          <span aria-hidden style={{ fontSize: 18, lineHeight: 1, marginTop: -2 }}>‹</span>
          Back
        </button>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.18em',
            color: INK,
            opacity: 0.55,
          }}
        >
          CAPTURE
        </span>
      </div>

      {/* Title — full-width below the top bar so long quest names breathe. */}
      <div className="relative px-6 md:px-8 pt-3 pb-4">
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: INK,
            lineHeight: 1.2,
            margin: 0,
            textShadow: '0 1px 12px rgba(255,255,255,0.5)',
          }}
        >
          {title}
        </h2>
      </div>

      {/* Mode toggle */}
      {allowed.length > 1 && phase !== 'captured' && (
        <div className="relative flex items-center justify-center px-6 md:px-8 pb-4">
          <div
            className="inline-flex"
            style={{
              padding: 4,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.9)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow:
                '0 2px 10px rgba(120,100,160,0.18), inset 0 1px 0 rgba(255,255,255,0.95)',
            }}
          >
            {allowed.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setMode(k)}
                disabled={phase === 'recording'}
                style={{
                  padding: '8px 20px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: mode === k ? GOLD : 'transparent',
                  color: mode === k ? GOLD_INK : INK,
                  opacity: phase === 'recording' && mode !== k ? 0.4 : 1,
                  boxShadow:
                    mode === k
                      ? '0 4px 12px rgba(245,197,66,0.4), inset 0 1px 0 rgba(255,255,255,0.55)'
                      : 'none',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stage — video / captured / error states all sit in a thick pearl-bordered card. */}
      <div className="relative flex-1 flex items-stretch justify-center px-6 md:px-8 pb-6 min-h-0">
        <div
          className="relative w-full max-w-[560px] flex items-center justify-center overflow-hidden"
          style={{
            borderRadius: 28,
            background: '#0A0A14',
            border: '3px solid rgba(255,255,255,0.92)',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.9), 0 20px 48px rgba(120,100,160,0.38), 0 0 0 1px rgba(120,100,160,0.18)',
          }}
        >
          {phase === 'captured' && captured ? (
            captured.kind === 'photo' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={captured.url}
                alt="Captured"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            ) : (
              <video
                src={captured.url}
                controls
                playsInline
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            )
          ) : phase === 'denied' || phase === 'unsupported' ? (
            <div
              className="absolute inset-0 flex items-center justify-center text-center px-8"
              style={{ background: PEARL_BG, color: INK }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: PEARL_SHIMMER, mixBlendMode: 'overlay' }}
              />
              <div className="relative">
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
                  {phase === 'denied' ? 'Camera blocked' : 'Camera unavailable'}
                </div>
                <div style={{ fontSize: 13, color: INK_MUTED }}>
                  {phase === 'denied'
                    ? 'Allow camera access in your browser settings and reload.'
                    : errorMsg ?? 'No camera on this device.'}
                </div>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}

          {phase === 'recording' && (
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-2"
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                background: 'rgba(220, 38, 38, 0.9)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.12em',
                boxShadow: '0 4px 14px rgba(220,38,38,0.45)',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: '#fff',
                  animation: 'pulse 1s ease-in-out infinite',
                }}
              />
              REC
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div
        className="relative flex items-center justify-center gap-4 px-6 md:px-8 pt-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)' }}
      >
        {phase === 'captured' ? (
          <>
            <button
              type="button"
              onClick={retake}
              className="transition-transform active:scale-[0.97]"
              style={{
                ...GLASS_PILL,
                height: 48,
                padding: '0 22px',
                fontSize: 14,
              }}
            >
              Retake
            </button>
            <button
              type="button"
              onClick={submit}
              className="inline-flex items-center gap-2 font-semibold transition-all active:scale-[0.97] hover:brightness-110"
              style={{
                height: 48,
                padding: '0 26px',
                borderRadius: 999,
                background: GOLD,
                color: GOLD_INK,
                fontSize: 14,
                letterSpacing: '0.01em',
                boxShadow:
                  '0 6px 22px rgba(245,197,66,0.45), 0 2px 10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(120,70,0,0.4)',
                textShadow: '0 1px 0 rgba(255,255,255,0.35)',
              }}
            >
              <span aria-hidden>✦</span>
              Submit
            </button>
          </>
        ) : phase === 'preview' || phase === 'recording' ? (
          <button
            type="button"
            onClick={onShutter}
            aria-label={mode === 'photo' ? 'Snap photo' : phase === 'recording' ? 'Stop recording' : 'Start recording'}
            className="transition-transform active:scale-[0.94]"
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              background: phase === 'recording' ? '#DC2626' : GOLD,
              border: '4px solid rgba(255,255,255,0.9)',
              boxShadow:
                phase === 'recording'
                  ? '0 10px 32px rgba(220,38,38,0.5), inset 0 1px 0 rgba(255,255,255,0.4)'
                  : '0 10px 32px rgba(245,197,66,0.55), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -2px 0 rgba(120,70,0,0.4)',
            }}
          >
            {phase === 'recording' && (
              <span
                aria-hidden
                className="block mx-auto"
                style={{ width: 22, height: 22, borderRadius: 4, background: '#fff' }}
              />
            )}
          </button>
        ) : null}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
