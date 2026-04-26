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
import { IconUsers } from "@tabler/icons-react";

const navItems = [
  { name: "Bounties", link: "/" },
  { name: "Projects", link: "/projects" },
  { name: "Grants", link: "/grants" },
];

const projects = [
  {
    name: "ZoDAO Governance",
    desc: "Decentralized governance platform for community proposals and voting.",
    color: "#66DF48",
    members: 34,
  },
  {
    name: "Zo Social Graph",
    desc: "On-chain social graph connecting creators, builders, and communities.",
    color: "#FFD600",
    members: 21,
  },
  {
    name: "Zo Quest Engine",
    desc: "Gamified quest system for onboarding new members and rewarding engagement.",
    color: "#FF2F8E",
    members: 45,
  },
];

export default function ProjectsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zui-dark font-sans text-zui-white">
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
                className="text-base font-medium tracking-wide text-zui-white"
              >
                {item.name}
              </a>
            ))}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <section className="mx-auto max-w-6xl px-4 pb-24 pt-32">
        <h1 className="mb-14 text-center font-headline text-6xl leading-[1.05] tracking-tight text-zui-white md:text-7xl">
          Featured Projects
        </h1>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.name}
              className="rounded-2xl border border-zui-stroke bg-zui-lighter p-7 transition-all hover:-translate-y-1 hover:border-zui-white/20 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.45)]"
            >
              <div
                className="mb-5 inline-block rounded-full border border-zui-stroke px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-zui-dark"
                style={{ backgroundColor: project.color }}
              >
                Active
              </div>
              <h3 className="mb-3 text-xl font-semibold text-zui-white">
                {project.name}
              </h3>
              <p className="mb-5 text-sm leading-relaxed text-zui-white/70">{project.desc}</p>
              <div className="flex items-center gap-2 text-sm text-zui-white/50">
                <IconUsers size={16} />
                <span>{project.members} members</span>
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
