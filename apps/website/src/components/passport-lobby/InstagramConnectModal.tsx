import { useEffect } from 'react';
import { rubikClassName } from '../utils/font';

export interface InstagramConnectModalProps {
  open: boolean;
  onClose: () => void;
  onConnect: () => void;
}

const IG_GRADIENT = 'linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #F77737 100%)';

function IgIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.39C1.34 2.69.93 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.39 2.13.67.67 1.34 1.09 2.13 1.39.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.13-1.39.67-.67 1.09-1.34 1.39-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.39-2.13C21.31 1.34 20.65.93 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0z"
        fill="currentColor"
      />
      <path
        d="M12 5.84A6.16 6.16 0 1 0 18.16 12 6.17 6.17 0 0 0 12 5.84zM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4zM18.41 7.59a1.44 1.44 0 1 0-1.44-1.44 1.44 1.44 0 0 0 1.44 1.44z"
        fill="currentColor"
      />
    </svg>
  );
}

export function InstagramConnectModal({ open, onClose, onConnect }: InstagramConnectModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ig-connect-title"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6 ${rubikClassName}`}
      onClick={onClose}
    >
      <div
        className="max-w-sm w-full text-center"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(180deg, rgba(40,40,40,0.95) 0%, rgba(15,15,15,0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24,
          padding: '32px 24px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* IG icon with gradient glow ring */}
        <div
          className="mx-auto flex items-center justify-center"
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: IG_GRADIENT,
            boxShadow: '0 0 0 6px rgba(225,48,108,0.2), 0 8px 24px rgba(225,48,108,0.35)',
            color: '#fff',
            marginBottom: 20,
          }}
        >
          <IgIcon />
        </div>

        <h2
          id="ig-connect-title"
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#fff',
            marginBottom: 8,
            lineHeight: '1.3em',
          }}
        >
          Connect Instagram to start
        </h2>

        <p
          style={{
            fontSize: 13,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: '1.5em',
            marginBottom: 24,
          }}
        >
          Quests require a linked Instagram account so we can verify your posts and deliver rewards.
          It takes 10 seconds.
        </p>

        {/* Connect CTA — IG gradient pill */}
        <button
          onClick={onConnect}
          className="flex items-center justify-center gap-2 mx-auto transition-all active:scale-95 hover:brightness-110"
          style={{
            background: IG_GRADIENT,
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            padding: '12px 28px',
            borderRadius: 999,
            border: 'none',
            boxShadow: '0 8px 24px rgba(225,48,108,0.35)',
            letterSpacing: '0.01em',
            cursor: 'pointer',
          }}
        >
          <IgIcon />
          Connect Instagram
        </button>

        {/* Dismiss */}
        <button
          onClick={onClose}
          className="block mx-auto mt-4"
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.4)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
