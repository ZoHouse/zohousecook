import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth, useProfile } from "@zo/auth";
import { ZoRadioPill } from "./ZoRadioPill";

export function DashboardHeader() {
  const { basePath } = useRouter();
  const { logout } = useAuth();
  const { profile } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Avatar: citizenship avatar > pfp_image
  const rawAvatar = profile?.avatar?.image || profile?.pfp_image;
  const avatar = rawAvatar && rawAvatar.length > 0
    ? rawAvatar.replace("static.cdn.zo.xyz", "proxy.cdn.zo.xyz")
    : undefined;
  const nickname = profile?.nickname || profile?.custom_nickname || "Citizen";

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <header className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-3 items-center px-dash-xl py-dash-lg bg-dash-bg-secondary backdrop-blur-dash-md border-t border-dash-border">
      <div className="flex items-center gap-dash-lg">
        <img src={`${basePath}/dashboard-assets/zo-world-icon.png`} alt="Zo" className="h-8" />
      </div>
      <div className="flex justify-center">
        <ZoRadioPill />
      </div>
      <div className="relative flex justify-end" ref={menuRef}>
        <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2">
          {avatar ? (
            <img src={avatar} alt={nickname} className="w-8 h-8 rounded-full object-cover border border-dash-border" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-dash-border" />
          )}
          <span className="text-sm text-dash-text-80">{nickname}</span>
        </button>
        {menuOpen && (
          <div className="absolute right-0 bottom-12 bg-dash-bg-solid border border-dash-border rounded-dash-md p-2 min-w-[160px] z-50">
            <button
              onClick={() => { logout(); setMenuOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-dash-text-80 hover:text-dash-text rounded-dash-sm hover:bg-dash-bg transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
