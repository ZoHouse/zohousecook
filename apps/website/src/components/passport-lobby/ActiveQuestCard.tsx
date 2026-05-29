import { rubikClassName } from '../utils/font';

export interface ActiveQuestCardProps {
  /** Quest headline rendered as the card's main line. */
  topic: string;
  /** Short deadline copy, e.g. "Ends 4:00 PM". */
  deadline?: string;
  /** Current step index (0–4). 0 = not started, 5 = all done */
  step?: number;
  xpReward?: number;
  zoCredReward?: number;
  onTap?: () => void;
}

// 5 stages from Erum's PRD: Link IG → Post → HQ verify → Results → Treasure Box
const STEPS = ['Link IG', 'Post', 'Verify', 'Reveal', 'Claim'];

export function ActiveQuestCard({
  topic,
  deadline,
  step = 0,
  xpReward,
  zoCredReward,
  onTap,
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

      {/* Rewards row — only the rewards the caller passed get rendered. */}
      <div className="flex items-center" style={{ gap: 10, fontSize: 10 }}>
        {typeof xpReward === 'number' && (
          <span className="flex items-center" style={{ gap: 4, color: '#FEDD1E', fontWeight: 600 }}>
            <span aria-hidden>⚡</span>
            <span>+{xpReward} XP</span>
          </span>
        )}
        {typeof xpReward === 'number' && typeof zoCredReward === 'number' && (
          <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.12)' }} aria-hidden />
        )}
        {typeof zoCredReward === 'number' && (
          <span className="flex items-center" style={{ gap: 4, color: '#A7D921', fontWeight: 600 }}>
            <span aria-hidden>◈</span>
            <span>{zoCredReward} Zo Credits</span>
          </span>
        )}
        {interactive && (
          <span
            className="ml-auto"
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.02em',
            }}
          >
            Start →
          </span>
        )}
      </div>
    </div>
  );
}
