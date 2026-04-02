import React from 'react';
import { GlassCard } from '../dashboard/GlassCard';
import type { RoomMember } from '../../hooks/useRoom';

interface RoomMembersProps {
  members: RoomMember[];
  hostCodes: string[];
  isConnected: boolean;
  speakingMap?: Record<string, boolean>;
}

export function RoomMembers({ members, hostCodes, isConnected, speakingMap = {} }: RoomMembersProps) {
  if (members.length === 0) return null;

  return (
    <GlassCard className="p-dash-xl">
      <div className="flex items-center justify-between mb-dash-lg">
        <h3 className="text-sm font-medium text-dash-text-50 uppercase tracking-wider">
          In the Room
        </h3>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-[10px] text-dash-text-40">
            {members.length} {members.length === 1 ? 'person' : 'people'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {members.map((member) => {
          const isHost = hostCodes.includes(member.code);
          const isSpeaking = speakingMap[member.code];
          return (
            <div
              key={member.code}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-dash-sm bg-white/5"
            >
              <div className={`w-7 h-7 rounded-full bg-white/10 border flex items-center justify-center flex-shrink-0 overflow-hidden ${isSpeaking ? 'border-green-400' : 'border-dash-border'}`}>
                <span className="text-[10px] font-medium text-dash-text">
                  {member.nickname?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <span className="text-xs text-dash-text flex-1 truncate">
                {member.nickname}
              </span>
              {isSpeaking && (
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              )}
              {isHost && (
                <span className="text-[9px] text-dash-accent px-1.5 py-0.5 bg-dash-accent/10 rounded-dash-pill">
                  Host
                </span>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
