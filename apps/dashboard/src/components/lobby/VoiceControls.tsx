import React from 'react';
import cn from '../../utils/cn';

interface VoiceControlsProps {
  isActive: boolean;
  isMuted: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onToggleMute: () => void;
}

export function VoiceControls({ isActive, isMuted, onJoin, onLeave, onToggleMute }: VoiceControlsProps) {
  if (!isActive) {
    return (
      <button
        onClick={onJoin}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-dash-pill transition-colors',
          'bg-white/10 border border-dash-border hover:bg-white/15 hover:border-dash-border-hover',
          'backdrop-blur-dash-md text-dash-text text-sm font-medium'
        )}
      >
        <MicIcon muted={false} size={16} />
        Join Voice
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggleMute}
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
          isMuted
            ? 'bg-white/10 border border-dash-border text-dash-text-50 hover:bg-white/15'
            : 'bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30'
        )}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        <MicIcon muted={isMuted} size={18} />
      </button>
      <button
        onClick={onLeave}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
        title="Leave Voice"
      >
        <PhoneOffIcon size={16} />
      </button>
    </div>
  );
}

function MicIcon({ muted, size = 20 }: { muted: boolean; size?: number }) {
  if (muted) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .44-.05.87-.14 1.28" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function PhoneOffIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <line x1="23" y1="1" x2="1" y2="23" />
    </svg>
  );
}
