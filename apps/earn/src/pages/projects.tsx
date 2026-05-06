import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState } from "react";
import Link from "next/link";
import { IconBriefcase, IconSparkles } from "@tabler/icons-react";
import { AuthCorner } from "@/components/AuthCorner";
import { LOGO_URL } from "@/lib/assets";

const navItems = [
  { name: "Quests", link: "/" },
  { name: "Leaderboard", link: "/leaderboard" },
  { name: "Projects", link: "/projects" },
  { name: "Grants", link: "/grants" },
];

export default function ProjectsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zui-dark font-sans text-zui-white">
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <AuthCorner />
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <Link
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium tracking-wide text-zui-white"
              >
                {item.name}
              </Link>
            ))}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <section className="mx-auto max-w-6xl px-4 pb-24 pt-32">
        <h1 className="mb-14 text-center font-headline text-6xl leading-[1.05] tracking-tight text-zui-white md:text-7xl">
          Featured Projects
        </h1>

        <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-dashed border-zui-stroke bg-zui-lighter p-12 text-center">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(circle at 50% 0%, rgba(102,223,72,0.12) 0%, transparent 60%)",
            }}
          />
          <div className="relative flex flex-col items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zui-stroke bg-zui-light/40">
              <IconBriefcase size={32} className="text-zui-pink" />
            </div>
            <span className="flex items-center gap-1.5 rounded-full border border-zui-green/40 bg-zui-green/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zui-green">
              <IconSparkles size={11} />
              Projects
            </span>
            <h2 className="font-headline text-5xl leading-tight tracking-tight text-zui-white md:text-6xl">
              Coming soon
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-zui-white/60">
              The first batch of community projects is being curated. Soon you&rsquo;ll be
              able to discover what Zo builders are shipping and jump into the ones that
              matter to you.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-zui-stroke bg-zui-lighter px-4 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_URL}
              alt="Zo"
              width={28}
              height={28}
              className="invert"
            />
            <span className="font-headline text-2xl tracking-tight text-zui-white">
              Marketplace
            </span>
          </div>
          <p className="text-sm text-zui-white/50">
            Zo World. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
