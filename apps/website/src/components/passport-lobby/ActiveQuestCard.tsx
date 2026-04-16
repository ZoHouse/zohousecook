import { rubikClassName } from '../utils/font';

export interface ActiveQuestCardProps {
  /** Quest headline, e.g. "Why I'd choose Zostel Pahalgam" */
  topic?: string;
  /** Short deadline copy, e.g. "Ends 4:00 PM" */
  deadline?: string;
  /** Current step index (0–4). 0 = not started, 5 = all done */
  step?: number;
  xpReward?: number;
  zoCredReward?: number;
  onTap?: () => void;
  /** When true, CTA shifts to 'Connect Instagram' — quest needs IG OAuth first. */
  requiresInstagram?: boolean;
}

// 5 stages from Erum's PRD: Link IG → Post → HQ verify → Results → Treasure Box
const STEPS = ['Link IG', 'Post', 'Verify', 'Reveal', 'Claim'];

export function ActiveQuestCard({
  topic = "Today's Quest: Why I'd choose Zostel Pahalgam",
  deadline = 'Ends 4:00 PM',
  step = 0,
  xpReward = 150,
  zoCredReward = 50,
  onTap,
  requiresInstagram = false,
}: ActiveQuestCardProps) {
  const interactive = !!onTap;

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onTap}
      onKeyDown={(e) => {
        if (!onTap) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTap();
        }
      }}
      className={`${rubikClassName} ${interactive ? 'cursor-pointer transition-transform active:scale-[0.98]' : ''}`}
      style={{
        width: 240,
        background: 'linear-gradient(180deg, rgba(40,40,40,0.85) 0%, rgba(20,20,20,0.85) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '10px 12px',
        boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Header: label + deadline pill */}
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: '#FEDD1E',
            textTransform: 'uppercase',
          }}
        >
          Active Quest
        </span>
        <span
          style={{
            fontSize: 8,
            fontWeight: 500,
            letterSpacing: '0.04em',
            color: 'rgba(255,255,255,0.65)',
            background: 'rgba(255,255,255,0.06)',
            padding: '2px 8px',
            borderRadius: 99,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {deadline}
        </span>
      </div>

      {/* Topic */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: '#FFFFFF',
          lineHeight: '1.25em',
          marginBottom: 10,
        }}
      >
        {topic}
      </div>

      {/* 5-step progress strip */}
      <div className="flex items-center" style={{ gap: 4, marginBottom: 8 }} aria-hidden>
        {STEPS.map((_, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: done
                  ? 'linear-gradient(90deg, #A7D921 0%, #FEDD1E 100%)'
                  : active
                  ? 'rgba(167,217,33,0.35)'
                  : 'rgba(255,255,255,0.08)',
              }}
            />
          );
        })}
      </div>

      {/* Rewards row */}
      <div className="flex items-center" style={{ gap: 10, fontSize: 10 }}>
        <span className="flex items-center" style={{ gap: 4, color: '#FEDD1E', fontWeight: 600 }}>
          <span aria-hidden>⚡</span>
          <span>+{xpReward} XP</span>
        </span>
        <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.12)' }} aria-hidden />
        <span className="flex items-center" style={{ gap: 4, color: '#A7D921', fontWeight: 600 }}>
          <span aria-hidden>◈</span>
          <span>{zoCredReward} Zo Credits</span>
        </span>
        {interactive && (
          <span
            className="ml-auto flex items-center"
            style={{
              fontSize: 10,
              fontWeight: 600,
              gap: 4,
              padding: requiresInstagram ? '4px 10px' : '0',
              borderRadius: 999,
              background: requiresInstagram
                ? 'linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #F77737 100%)'
                : 'transparent',
              color: requiresInstagram ? '#fff' : 'rgba(255,255,255,0.55)',
              letterSpacing: '0.02em',
              boxShadow: requiresInstagram ? '0 4px 12px rgba(225,48,108,0.35)' : 'none',
            }}
          >
            {requiresInstagram ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.39C1.34 2.69.93 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.39 2.13.67.67 1.34 1.09 2.13 1.39.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.13-1.39.67-.67 1.09-1.34 1.39-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.39-2.13C21.31 1.34 20.65.93 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0z"
                    fill="currentColor"
                  />
                  <path
                    d="M12 5.84A6.16 6.16 0 1 0 18.16 12 6.17 6.17 0 0 0 12 5.84zM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4zM18.41 7.59a1.44 1.44 0 1 0-1.44-1.44 1.44 1.44 0 0 0 1.44 1.44z"
                    fill="currentColor"
                  />
                </svg>
                Connect Instagram
              </>
            ) : (
              'Start →'
            )}
          </span>
        )}
      </div>
    </div>
  );
}
