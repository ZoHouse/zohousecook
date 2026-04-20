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
    color: "#4ECDC4",
    members: 34,
  },
  {
    name: "Zo Social Graph",
    desc: "On-chain social graph connecting creators, builders, and communities.",
    color: "#FFE566",
    members: 21,
  },
  {
    name: "Zo Quest Engine",
    desc: "Gamified quest system for onboarding new members and rewarding engagement.",
    color: "#FF6B6B",
    members: 45,
  },
];

export default function ProjectsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#1a1a1a] font-sans">
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
        <h1
          className="mb-12 text-center text-5xl font-black uppercase tracking-tight text-white"
          style={{ textShadow: "3px 3px 0px #FFE566" }}
        >
          Featured Projects
        </h1>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.name}
              className="rounded-xl border-4 border-white/20 bg-white/5 p-6 backdrop-blur transition-all hover:-translate-y-1 hover:border-white/40"
            >
              <div
                className="mb-4 inline-block rounded-md border-2 border-black px-3 py-1 text-xs font-black uppercase text-black"
                style={{ backgroundColor: project.color }}
              >
                Active
              </div>
              <h3 className="mb-2 text-xl font-black uppercase text-white">
                {project.name}
              </h3>
              <p className="mb-4 text-sm text-white/70">{project.desc}</p>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <IconUsers size={16} />
                <span>{project.members} members</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t-4 border-white/10 bg-black px-4 py-10">
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
