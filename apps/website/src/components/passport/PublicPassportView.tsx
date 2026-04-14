import React from "react";
import { usePublicPassport } from "../../hooks/usePublicPassport";
import { PassportPitch, ViewerState } from "./PassportPitch";

interface PublicPassportViewProps {
  handle: string;
  viewerState: ViewerState;
}

function StatCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-3 rounded-xl bg-white/5">
      <span className="text-2xl font-bold text-white tabular-nums">{value}</span>
      <span className="text-[10px] text-white/50 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function AvatarFallback({ initial }: { initial: string }) {
  return (
    <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
      <span className="text-5xl font-bold text-white">{initial}</span>
    </div>
  );
}

function formatXp(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function PublicPassportView({ handle, viewerState }: PublicPassportViewProps) {
  const { data, isLoading, isError } = usePublicPassport(handle);

  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen bg-[#111] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 min-h-screen bg-[#111] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-2">Passport not found</h1>
          <p className="text-white/50">
            {handle} hasn&apos;t unlocked their passport yet.
          </p>
        </div>
      </div>
    );
  }

  const initial = data.display_name.charAt(0).toUpperCase();

  return (
    <div className="flex-1 min-h-screen bg-[#111]">
      <div className="max-w-md mx-auto px-4 pt-32 pb-16">
        <div className="flex flex-col items-center gap-4 mb-6">
          {data.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.avatar_url}
              alt={data.display_name}
              className="w-28 h-28 rounded-2xl object-cover"
            />
          ) : (
            <AvatarFallback initial={initial} />
          )}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">{data.custom_nickname}</h1>
            <p className="text-white/60 text-sm mt-1">{data.display_name}</p>
            {(data.hometown || data.nationality) && (
              <p className="text-white/40 text-xs mt-1">
                {data.hometown && `from ${data.hometown}`}
                {data.hometown && data.nationality && ", "}
                {data.nationality}
              </p>
            )}
          </div>
          {data.roles.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {data.roles.map((role) => (
                <span
                  key={role.key}
                  className="px-3 py-1 rounded-full bg-white/10 text-white text-xs"
                >
                  {role.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6 p-5 bg-white/5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Passport Rank</p>
            <p className="text-xl font-bold text-white mt-1">{data.xp.rank_title}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Total XP</p>
            <p className="text-xl font-bold text-white tabular-nums mt-1">
              {formatXp(data.xp.total)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
          <StatCell label="Stamps" value={data.stamps.length} />
          <StatCell label="Stays" value={data.stats.stays} />
          <StatCell label="Frens" value={data.stats.tribe} />
          <StatCell label="Reels" value={data.stats.reels_qualified} />
        </div>

        {data.stamps.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
              Destination Stamps
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {data.stamps.map((stamp) => (
                <div
                  key={stamp.key}
                  className="aspect-square rounded-xl bg-white/5 flex items-center justify-center p-2 text-center"
                >
                  <span className="text-[10px] text-white/80">{stamp.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.badges.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Badges</h2>
            <div className="flex flex-wrap gap-2">
              {data.badges.map((badge) => (
                <span
                  key={badge.key}
                  className="px-3 py-1 rounded-full bg-white/10 text-white text-xs"
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.trophies.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
              Season Champions
            </h2>
            <div className="flex gap-2">
              {data.trophies.map((trophy, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-white/10 text-white text-xs capitalize"
                >
                  {trophy.medal} • {trophy.season}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.tribe_sample.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
              Tribe ({data.tribe_total})
            </h2>
            <div className="flex -space-x-2">
              {data.tribe_sample.map((member) => (
                <div
                  key={member.handle}
                  className="w-8 h-8 rounded-full bg-white/10 border-2 border-[#111]"
                  title={member.handle}
                />
              ))}
            </div>
          </div>
        )}

        <PassportPitch inviterHandle={handle} viewerState={viewerState} />
      </div>
    </div>
  );
}
