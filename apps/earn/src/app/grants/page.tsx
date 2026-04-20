"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState } from "react";
import Image from "next/image";

const navItems = [
  { name: "Bounties", link: "/" },
  { name: "Projects", link: "/projects" },
  { name: "Grants", link: "/grants" },
];

const grants = [
  {
    title: "Builder Grant",
    amount: "Up to $5,000",
    desc: "For developers building tools, dApps, and infrastructure for the Zo ecosystem.",
    color: "#4ECDC4",
  },
  {
    title: "Creator Grant",
    amount: "Up to $2,500",
    desc: "For content creators, designers, and artists contributing to the Zo brand.",
    color: "#A78BFA",
  },
  {
    title: "Community Grant",
    amount: "Up to $1,500",
    desc: "For community organizers running events, meetups, and educational workshops.",
    color: "#FFE566",
  },
  {
    title: "Research Grant",
    amount: "Up to $10,000",
    desc: "For researchers exploring decentralized governance, tokenomics, and social coordination.",
    color: "#FF6B6B",
  },
];

export default function GrantsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFFBF0] font-sans">
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
            <NavbarButton variant="secondary">Login</NavbarButton>
            <NavbarButton variant="primary">Post a Bounty</NavbarButton>
          </div>
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
                className="text-base font-bold uppercase tracking-wide text-black"
              >
                {item.name}
              </a>
            ))}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="mb-12 flex items-center justify-center gap-3">
          <Image src="/money.png" alt="Money" width={48} height={48} />
          <h1 className="text-center text-5xl font-black uppercase tracking-tight text-black">
            Grants Program
          </h1>
          <Image src="/money.png" alt="Money" width={48} height={48} />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {grants.map((grant) => (
            <div
              key={grant.title}
              className="flex gap-4 rounded-xl border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_#000] transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000]"
            >
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-black text-xl font-black text-black"
                style={{ backgroundColor: grant.color }}
              >
                $
              </div>
              <div>
                <h3 className="text-lg font-black uppercase text-black">
                  {grant.title}
                </h3>
                <p className="mb-1 text-sm font-bold text-black/70">
                  {grant.amount}
                </p>
                <p className="text-sm text-black/60">{grant.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <NavbarButton variant="gradient" href="#">
            Apply for a Grant
          </NavbarButton>
        </div>
      </section>

      <footer className="border-t-4 border-black bg-black px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Zo" width={28} height={28} className="invert" />
            <span className="text-lg font-black uppercase text-white">
              Marketplace
            </span>
          </div>
          <p className="text-sm text-white/50">
            Zo World. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
