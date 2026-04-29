import { IconFlame, IconTrophy } from "@tabler/icons-react";

type Player = {
  level: number;
  xp: number;
  xpMax: number;
  streak: number;
  achievements: Array<{ unlocked: boolean }>;
};

export function NavChip({ xpPct, player }: { xpPct: number; player: Player }) {
  const trophiesWon = player.achievements.filter((a) => a.unlocked).length;
  const trophiesTotal = player.achievements.length || 8;
  return (
    <div className="flex items-center gap-2 rounded-md border border-zui-stroke bg-zui-light/60 px-2 py-1">
      <div className="relative shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-zui-green/40 bg-zui-green">
          <span className="text-xs font-bold text-zui-dark">Z</span>
        </div>
        <span className="absolute -bottom-1 -right-1 rounded-sm border border-zui-yellow/60 bg-zui-yellow px-0.5 text-[8px] font-bold leading-none text-zui-dark">
          {player.level}
        </span>
      </div>

      <div className="flex w-28 flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-bold uppercase leading-none tracking-wider text-zui-white/80">
            XP
          </span>
          <span className="text-[8px] font-bold tabular-nums leading-none text-zui-white/50">
            {Math.round((player.xp / player.xpMax) * 100)}%
          </span>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-sm border border-zui-stroke bg-zui-dark">
          <div className="xp-bar-fill h-full" style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-1 border-l border-zui-stroke pl-2">
        <span
          title="Streak"
          className="flex items-center gap-0.5 text-[11px] font-bold tabular-nums text-zui-white"
        >
          <IconFlame size={11} className="flame-flicker text-zui-orange" />
          {player.streak}d
        </span>
        <span
          title="Trophies"
          className="hidden items-center gap-0.5 text-[11px] font-bold tabular-nums text-zui-white xl:flex"
        >
          <IconTrophy size={11} className="text-zui-yellow" />
          {trophiesWon}/{trophiesTotal}
        </span>
      </div>
    </div>
  );
}
