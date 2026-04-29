import { useState } from "react";
import { useAuth } from "@zo/auth";
import { IconArrowRight, IconLogout, IconUser } from "@tabler/icons-react";
import { NavChip } from "./NavChip";

type Player = {
  handle: string;
  title: string;
  level: number;
  xp: number;
  xpMax: number;
  streak: number;
  achievements: Array<{ unlocked: boolean }>;
};

export function AuthCorner({
  xpPct,
  player,
}: {
  xpPct?: number;
  player?: Player;
}) {
  const { isLoggedIn, showLoginModal, logout, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isLoggedIn === null) {
    return (
      <div className="flex h-9 items-center rounded-md border border-zui-stroke bg-zui-light/40 px-3 text-[10px] font-medium uppercase tracking-wider text-zui-white/40">
        …
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={() => showLoginModal(["mobile"])}
        className="flex h-9 items-center gap-1.5 rounded-md border border-zui-green/60 bg-zui-green px-3.5 text-xs font-semibold uppercase tracking-wider text-zui-dark transition-transform hover:scale-[1.03]"
      >
        Sign in
        <IconArrowRight size={13} strokeWidth={2.5} />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center"
      >
        {player && typeof xpPct === "number" ? (
          <NavChip xpPct={xpPct} player={player} />
        ) : (
          <div className="flex h-9 items-center gap-2 rounded-md border border-zui-stroke bg-zui-light/40 px-3">
            <div className="flex h-6 w-6 items-center justify-center rounded border border-zui-green/40 bg-zui-green">
              <IconUser size={12} strokeWidth={2.5} className="text-zui-dark" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zui-white">
              {user?.mobile_number ? `+${user.mobile_number.slice(-4)}` : "You"}
            </span>
          </div>
        )}
      </button>
      {menuOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-zui-stroke bg-zui-lighter shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]"
          onMouseLeave={() => setMenuOpen(false)}
        >
          <div className="border-b border-zui-stroke px-3 py-2">
            <p className="truncate text-[11px] font-medium text-zui-white">
              {user?.mobile_number ?? player?.handle ?? "Signed in"}
            </p>
            {player?.title && (
              <p className="text-[9px] uppercase tracking-wider text-zui-white/50">
                {player.title}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-zui-white hover:bg-zui-light/60"
          >
            <IconLogout size={13} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
