import { useEffect, useState } from 'react';
import { rubikClassName } from '../utils/font';

export interface SubmitPostUrlModalProps {
  open: boolean;
  onClose: () => void;
  /** POSTs proof_url to the submission endpoint. Resolves on success so the
      modal can close; rejects so the caller can toast the server error. */
  onSubmit: (proofUrl: string) => Promise<unknown>;
  /** Opens the existing Instagram-only ShareModal so the citizen can craft
      the post before grabbing its link. Optional — hidden when absent. */
  onShare?: () => void;
  /** Quest headline, shown so the citizen knows which quest they're proving. */
  questTitle?: string;
  /** True while the submission mutation is in flight (disables the button). */
  submitting?: boolean;
  /** True once participation.status === 'Submitted' — flips copy to "update"
      and pre-fills the previously submitted link. */
  alreadySubmitted?: boolean;
  /** Previously submitted proof_url, used to pre-fill on re-submit. */
  initialUrl?: string;
}

const IG_GRADIENT = 'linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #F77737 100%)';

// Accepts instagram.com post / reel / share permalinks. We keep this loose —
// the backend is the real gate; this only catches obvious paste mistakes
// (empty, a handle without a URL, a non-IG link) before the round-trip.
function isLikelyInstagramUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return /(^|\.)instagram\.com$/i.test(url.hostname);
  } catch {
    return false;
  }
}

export function SubmitPostUrlModal({
  open,
  onClose,
  onSubmit,
  onShare,
  questTitle,
  submitting = false,
  alreadySubmitted = false,
  initialUrl = '',
}: SubmitPostUrlModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [touched, setTouched] = useState(false);

  // Reset the field each time the modal opens so it never carries a stale
  // value from a previously selected quest.
  useEffect(() => {
    if (open) {
      setUrl(initialUrl);
      setTouched(false);
    }
  }, [open, initialUrl]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const valid = isLikelyInstagramUrl(url);
  const showError = touched && !valid && url.trim().length > 0;

  const handleSubmit = async () => {
    if (!valid || submitting) return;
    await onSubmit(url.trim());
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-post-title"
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
        {/* IG icon with gradient glow ring — mirrors InstagramConnectModal. */}
        <div
          className="mx-auto flex items-center justify-center"
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: IG_GRADIENT,
            boxShadow: '0 0 0 6px rgba(225,48,108,0.2), 0 8px 24px rgba(225,48,108,0.35)',
            color: '#fff',
            fontSize: 30,
            marginBottom: 20,
          }}
        >
          <span aria-hidden>🔗</span>
        </div>

        <h2
          id="submit-post-title"
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#fff',
            marginBottom: 8,
            lineHeight: '1.3em',
          }}
        >
          {alreadySubmitted ? 'Update your post link' : 'Submit your post'}
        </h2>

        <p
          style={{
            fontSize: 13,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: '1.5em',
            marginBottom: 20,
          }}
        >
          {questTitle ? (
            <>
              Posted for <span style={{ color: 'rgba(255,255,255,0.8)' }}>{questTitle}</span>? Paste
              the Instagram link so HQ can verify it and release your reward.
            </>
          ) : (
            'Paste the link to your Instagram post so HQ can verify it and release your reward.'
          )}
        </p>

        {onShare && (
          <button
            onClick={onShare}
            className="flex items-center justify-center gap-2 mx-auto transition-all active:scale-95 hover:brightness-110"
            style={{
              background: IG_GRADIENT,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              padding: '9px 18px',
              borderRadius: 999,
              border: 'none',
              boxShadow: '0 6px 18px rgba(225,48,108,0.3)',
              marginBottom: 18,
              cursor: 'pointer',
            }}
          >
            Share to Instagram first
          </button>
        )}

        {/* URL field */}
        <input
          type="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => setTouched(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          placeholder="https://instagram.com/p/…"
          aria-label="Instagram post link"
          aria-invalid={showError}
          className="w-full"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${showError ? 'rgba(231,76,60,0.7)' : 'rgba(255,255,255,0.14)'}`,
            borderRadius: 12,
            padding: '12px 14px',
            color: '#fff',
            fontSize: 14,
            outline: 'none',
            textAlign: 'center',
          }}
        />
        <div
          style={{
            minHeight: 16,
            fontSize: 11,
            color: 'rgba(231,76,60,0.9)',
            marginTop: 6,
            marginBottom: 14,
            textAlign: 'left',
          }}
        >
          {showError ? 'Enter a valid instagram.com link.' : ''}
        </div>

        {/* Submit CTA */}
        <button
          onClick={handleSubmit}
          disabled={!valid || submitting}
          className="flex items-center justify-center gap-2 mx-auto transition-all active:scale-95 hover:brightness-110"
          style={{
            background: !valid || submitting ? 'rgba(255,255,255,0.12)' : IG_GRADIENT,
            color: !valid || submitting ? 'rgba(255,255,255,0.4)' : '#fff',
            fontSize: 15,
            fontWeight: 600,
            padding: '12px 28px',
            borderRadius: 999,
            border: 'none',
            boxShadow: !valid || submitting ? 'none' : '0 8px 24px rgba(225,48,108,0.35)',
            letterSpacing: '0.01em',
            cursor: !valid || submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Submitting…' : alreadySubmitted ? 'Update link' : 'Submit for review'}
        </button>

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
