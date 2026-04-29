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
import { useEffect, useState } from "react";
import Image from "next/image";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const navItems = [
  { name: "Bounties", link: "/" },
  { name: "Projects", link: "/projects" },
  { name: "Grants", link: "/grants" },
];

type Grant = {
  id: string;
  title: string;
  amount: string;
  description?: string | null;
  color?: string | null;
};

export default function GrantsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [grants, setGrants] = useState<Grant[]>([]);

  useEffect(() => {
    fetch(`${basePath}/api/grants`)
      .then((r) => r.json())
      .then((data) => setGrants(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-zui-dark font-sans text-zui-white">
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div />
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
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium tracking-wide text-zui-white"
              >
                {item.name}
              </a>
            ))}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <section className="mx-auto max-w-6xl px-4 pb-24 pt-32">
        <div className="mb-14 flex items-center justify-center gap-4">
          <Image src="/money.png" alt="Money" width={48} height={48} />
          <h1 className="text-center font-headline text-6xl leading-[1.05] tracking-tight text-zui-white md:text-7xl">
            Grants Program
          </h1>
          <Image src="/money.png" alt="Money" width={48} height={48} />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {grants.map((grant) => (
            <div
              key={grant.id}
              className="flex gap-5 rounded-2xl border border-zui-stroke bg-zui-lighter p-7 transition-all hover:-translate-y-1 hover:border-zui-white/20 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.45)]"
            >
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-zui-stroke text-xl font-bold text-zui-dark"
                style={{ backgroundColor: grant.color || "#66DF48" }}
              >
                $
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zui-white">
                  {grant.title}
                </h3>
                <p className="mb-2 text-sm font-medium text-zui-green">
                  {grant.amount}
                </p>
                <p className="text-sm leading-relaxed text-zui-white/60">
                  {grant.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-zui-stroke bg-zui-lighter px-4 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Zo" width={28} height={28} className="invert" />
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
