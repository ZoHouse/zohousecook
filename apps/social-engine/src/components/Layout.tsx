import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";

const TABS = [
  { href: "/compose", label: "Compose" },
  { href: "/queue", label: "Queue" },
];

export function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zui-grey/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/queue" className="text-lg font-semibold tracking-tight">
            Social Engine
          </Link>
          <nav className="flex gap-1">
            {TABS.map((t) => {
              const active = router.pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`px-3 py-1.5 rounded-md text-sm transition ${
                    active
                      ? "bg-zui-white text-zui-dark"
                      : "text-zui-white/70 hover:text-zui-white hover:bg-zui-white/10"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="text-xs text-zui-white/40">v0 · X only</div>
      </header>
      <main className="flex-1 px-6 py-6">{children}</main>
    </div>
  );
}
