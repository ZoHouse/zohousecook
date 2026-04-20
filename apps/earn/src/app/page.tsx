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
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  IconCoin,
  IconUsers,
  IconClock,
  IconLayoutGrid,
  IconTable,
  IconExternalLink,
} from "@tabler/icons-react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const navItems = [
  { name: "Bounties", link: "/" },
  { name: "Projects", link: "/projects" },
  { name: "Grants", link: "/grants" },
];

type Bounty = {
  id: string;
  title: string;
  description: string | null;
  reward: string;
  applicants: number;
  deadline: string | null;
  tags: string[];
  color: string | null;
  source: string;
  url: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
  superteam: "Superteam",
  layer3: "Layer3",
  gitcoin: "Gitcoin",
  dework: "Dework",
  replit: "Replit",
  github: "GitHub",
};

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBounties() {
      try {
        const params = new URLSearchParams();
        if (sourceFilter) params.set("source", sourceFilter);
        const res = await fetch(`${basePath}/api/bounties?${params.toString()}`);
        const data = await res.json();
        setBounties(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch bounties:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBounties();
  }, [sourceFilter]);

  return (
    <div className="min-h-screen bg-[#FFFBF0] font-sans">
      {/* Navbar */}
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
            <div className="flex w-full flex-col gap-4">
              <NavbarButton
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                className="w-full"
              >
                Post a Bounty
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Banner */}
      <section className="relative w-full overflow-hidden border-b-4 border-black">
        <div className="relative h-[390px] w-full md:h-[390px]">
          <Image
            src="/banner.png"
            alt="Zo World Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
            <h1
              className="mb-4 text-center text-5xl font-black uppercase leading-tight tracking-tight text-white md:text-7xl"
              style={{ textShadow: "4px 4px 0px #000" }}
            >
              Zo it. Earn it.
            </h1>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-b-4 border-black bg-[#F1563F]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-around gap-4 px-4 py-4">
          {[
            { label: "Active Bounties", value: String(bounties.length || "—") },
            { label: "Total Earned", value: "$128K+" },
            { label: "Contributors", value: "1,200+" },
            { label: "Projects", value: "85" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="text-2xl font-black text-white md:text-3xl">
                {stat.value}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Bounties Section */}
      <section id="bounties" className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-4xl font-black uppercase tracking-tight text-black">
            Open Bounties
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSourceFilter(null)}
                className={`rounded-md border-2 border-black px-3 py-1 text-xs font-bold uppercase transition-colors ${
                  !sourceFilter
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-black/10"
                }`}
              >
                All
              </button>
              {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSourceFilter(key)}
                  className={`rounded-md border-2 border-black px-3 py-1 text-xs font-bold uppercase transition-colors ${
                    sourceFilter === key
                      ? "bg-black text-white"
                      : "bg-white text-black hover:bg-black/10"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-lg border-[3px] border-black bg-white p-1 shadow-[3px_3px_0px_0px_#000]">
              <button
                onClick={() => setViewMode("cards")}
                className={`rounded-md p-2 transition-colors ${
                  viewMode === "cards"
                    ? "bg-black text-white"
                    : "text-black hover:bg-black/10"
                }`}
              >
                <IconLayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`rounded-md p-2 transition-colors ${
                  viewMode === "table"
                    ? "bg-black text-white"
                    : "text-black hover:bg-black/10"
                }`}
              >
                <IconTable size={18} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-lg font-bold text-black/40">Loading bounties...</div>
          </div>
        ) : bounties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-lg font-bold text-black/40">No bounties found</div>
            <p className="mt-2 text-sm text-black/30">
              Run the scraper to populate bounties.
            </p>
          </div>
        ) : viewMode === "cards" ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bounties.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>
        ) : (
          <BountyTable bounties={bounties} />
        )}
      </section>

      {/* Footer */}
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

function BountyCard({ bounty }: { bounty: Bounty }) {
  return (
    <a
      href={bounty.url || "#"}
      target={bounty.url ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="group flex flex-col rounded-xl border-4 border-black bg-white shadow-[6px_6px_0px_0px_#000] transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000]"
    >
      <div
        className="h-3 w-full rounded-t-[8px]"
        style={{ backgroundColor: bounty.color || "#000" }}
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <span
            className="rounded-md border-2 border-black px-2 py-0.5 text-xs font-black uppercase text-white"
            style={{ backgroundColor: bounty.color || "#000" }}
          >
            {SOURCE_LABELS[bounty.source] || bounty.source}
          </span>
          {bounty.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border-2 border-black bg-[#FFFBF0] px-2 py-0.5 text-xs font-bold uppercase text-black"
            >
              {tag}
            </span>
          ))}
        </div>
        <h3 className="mb-2 text-lg font-black leading-tight text-black">
          {bounty.title}
        </h3>
        {bounty.description && (
          <p className="mb-4 flex-1 text-sm text-black/60">
            {bounty.description}
          </p>
        )}
        <div className="flex items-center justify-between border-t-2 border-dashed border-black/20 pt-3">
          <div className="flex items-center gap-1 text-sm font-black text-black">
            <IconCoin size={18} className="text-[#F59E0B]" />
            {bounty.reward}
          </div>
          <div className="flex items-center gap-3 text-xs text-black/50">
            <span className="flex items-center gap-1">
              <IconUsers size={14} />
              {bounty.applicants}
            </span>
            {bounty.deadline && (
              <span className="flex items-center gap-1">
                <IconClock size={14} />
                {bounty.deadline}
              </span>
            )}
            {bounty.url && (
              <IconExternalLink size={14} className="text-black/30" />
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

function BountyTable({ bounties }: { bounties: Bounty[] }) {
  return (
    <div className="overflow-hidden rounded-xl border-4 border-black bg-white shadow-[6px_6px_0px_0px_#000]">
      <table className="w-full">
        <thead>
          <tr className="border-b-4 border-black bg-[#FFFBF0]">
            <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-black">
              Bounty
            </th>
            <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-black">
              Source
            </th>
            <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-black">
              Tags
            </th>
            <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-black">
              Reward
            </th>
            <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-black">
              Deadline
            </th>
          </tr>
        </thead>
        <tbody>
          {bounties.map((bounty, idx) => (
            <tr
              key={bounty.id}
              onClick={() => bounty.url && window.open(bounty.url, "_blank")}
              className={`cursor-pointer transition-colors hover:bg-[#FFFBF0] ${
                idx !== bounties.length - 1
                  ? "border-b-2 border-dashed border-black/20"
                  : ""
              }`}
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: bounty.color || "#000" }}
                  />
                  <div>
                    <p className="font-black leading-tight text-black">
                      {bounty.title}
                    </p>
                    {bounty.description && (
                      <p className="mt-0.5 text-xs text-black/50">
                        {bounty.description}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <span
                  className="rounded-md border-2 border-black px-2 py-0.5 text-xs font-black uppercase text-white"
                  style={{ backgroundColor: bounty.color || "#000" }}
                >
                  {SOURCE_LABELS[bounty.source] || bounty.source}
                </span>
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-1">
                  {bounties[idx].tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border-2 border-black bg-[#FFFBF0] px-2 py-0.5 text-xs font-bold uppercase text-black"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-1 text-sm font-black text-black">
                  <IconCoin size={16} className="text-[#F59E0B]" />
                  {bounty.reward}
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-1 text-sm text-black/60">
                  {bounty.deadline ? (
                    <>
                      <IconClock size={14} />
                      {bounty.deadline}
                    </>
                  ) : (
                    <span className="text-black/30">—</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
