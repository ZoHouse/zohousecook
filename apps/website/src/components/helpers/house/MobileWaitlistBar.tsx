import { useAuth } from "@zo/auth";

function fixAvatarUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("ipfs://")) return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  if (url.includes("static.cdn.zo.xyz")) return url.replace("static.cdn.zo.xyz", "proxy.cdn.zo.xyz");
  return url;
}

export function MobileWaitlistBar() {
  const { user, isLoggedIn, showLoginModal } = useAuth();

  const avatarUrl = user ? fixAvatarUrl((user as any).avatar?.image || (user as any).pfp_image) : undefined;
  const displayName = (user as any)?.custom_nickname || (user as any)?.nickname || (user as any)?.first_name || "Citizen";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden p-3 bg-black/80 backdrop-blur-xl border-t border-white/10">
      {isLoggedIn && user ? (
        <a
          href="https://zostel.typeform.com/to/LgcBfa0M"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/10 border border-white/15 rounded-full p-1 flex items-center w-full active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2.5 px-3 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-white text-[10px] font-bold">
                  {displayName[0].toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-white/60 text-xs truncate">{displayName}</span>
          </div>
          <span className="bg-white text-black font-bold text-[10px] tracking-widest uppercase rounded-full px-5 py-2.5 flex-shrink-0">
            apply
          </span>
        </a>
      ) : (
        <div
          className="bg-white/10 border border-white/15 rounded-full p-1 flex items-center w-full cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => showLoginModal()}
        >
          <span className="text-white/40 px-4 text-xs flex-1">Join the waitlist</span>
          <span className="bg-white text-black font-bold text-[10px] tracking-widest uppercase rounded-full px-5 py-2.5 flex-shrink-0">
            tune in
          </span>
        </div>
      )}
    </div>
  );
}
