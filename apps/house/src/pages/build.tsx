import Link from "next/link";
import React from "react";
import { MetaTags } from "../components/common/MetaTags";
import { BlurFade } from "../components/helpers/house";

const HOUSES = [
  {
    code: "BLRxZo",
    area: "Koramangala",
    price: "₹12,000",
    slots: 10,
  },
  {
    code: "WTFxZo",
    area: "Whitefield",
    price: "₹10,000",
    slots: 10,
  },
];

const PERKS = [
  { title: "Two locations", body: "Pick the house that fits your stack. Koramangala for the deal flow, Whitefield for the deep work." },
  { title: "Cafe Zomad on-site", body: "Resident chefs serve breakfast, lunch, dinner. No food runs, no cold sandwiches." },
  { title: "Founder density", body: "You're coworking next to builders shipping, not a B2B SaaS sales floor." },
  { title: "House events", body: "Build sprints, mentor sessions, founder dinners, demo days. You're invited." },
];

const Build: React.FC = () => {
  return (
    <main className="bg-black min-h-screen text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <MetaTags
        title="Build · Zo House Coworking"
        description="Coworking at India's first permanent hacker house. 10 monthly slots per house, two nodes in Bangalore."
      />

      <header className="fixed top-0 left-0 w-full z-50 px-8 md:px-28 py-6 bg-transparent flex justify-between items-center max-w-full">
        <Link href="/" className="text-xl font-black tracking-tighter text-white font-[family-name:var(--font-headline)] italic shiny-gold">
          Zo House
        </Link>
        <Link href="/" className="text-[11px] tracking-[3px] uppercase text-white/40 hover:text-white transition-colors">
          ← Back
        </Link>
      </header>

      <section className="pt-32 md:pt-48 pb-16 px-8 md:px-28">
        <div className="max-w-5xl mx-auto text-center">
          <BlurFade inView delay={0.1} direction="up">
            <p className="text-[10px] md:text-[11px] tracking-[3px] uppercase text-white/40 mb-6">
              Build · Coworking · Bangalore
            </p>
            <h1 className="text-5xl md:text-7xl font-medium tracking-tight leading-[0.95]">
              A desk{" "}
              <span className="font-[family-name:var(--font-headline)] italic font-normal shiny-gold">
                inside
              </span>{" "}
              the civilisation.
            </h1>
            <p className="text-neutral-400 text-base md:text-lg font-light mt-8 max-w-2xl mx-auto">
              Cowork alongside the resident founders. Not a coworking space, a hacker house that opens 10 desks per node.
            </p>
          </BlurFade>
        </div>
      </section>

      <section className="px-8 md:px-28 pb-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERKS.map(({ title, body }) => (
            <BlurFade key={title} inView delay={0.15} direction="up">
              <div className="border border-white/10 p-8 md:p-10">
                <p className="font-[family-name:var(--font-headline)] italic text-2xl md:text-3xl shiny-gold">
                  {title}
                </p>
                <p className="text-sm text-neutral-400 font-light mt-4">{body}</p>
              </div>
            </BlurFade>
          ))}
        </div>
      </section>

      <section className="px-8 md:px-28 pb-20">
        <div className="max-w-7xl mx-auto">
          <BlurFade inView delay={0.1} direction="up">
            <h2 className="text-3xl md:text-5xl font-medium tracking-tight mb-12 text-center">
              Pick your{" "}
              <span className="font-[family-name:var(--font-headline)] italic font-normal shiny-gold">
                house
              </span>
            </h2>
          </BlurFade>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {HOUSES.map((house) => (
              <BlurFade key={house.code} inView delay={0.15} direction="up">
                <div className="border border-white/10 p-8 md:p-10 h-full flex flex-col">
                  <p className="text-[10px] tracking-[3px] uppercase text-white/40">{house.area}</p>
                  <h3 className="font-[family-name:var(--font-headline)] italic text-4xl md:text-5xl shiny-gold mt-2">
                    {house.code}
                  </h3>
                  <p className="text-sm text-neutral-400 font-light mt-3">
                    {house.slots} coworking slots
                  </p>

                  <div className="mt-8 flex items-baseline justify-between border-t border-white/5 pt-6 flex-1">
                    <div>
                      <p className="text-[10px] tracking-[3px] uppercase text-white/40">Monthly member</p>
                      <p className="text-xs text-neutral-500 mt-1">Anytime access, all events</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl md:text-4xl font-medium shiny-gold">{house.price}</span>
                      <span className="text-xs text-neutral-500 ml-1">/ month</span>
                    </div>
                  </div>

                  <Link
                    href="/?apply=1"
                    className="block mt-10 text-center text-[11px] tracking-[3px] uppercase py-3 border border-white/20 text-white/70 hover:border-white hover:text-white transition-colors"
                  >
                    Apply for a desk
                  </Link>
                </div>
              </BlurFade>
            ))}
          </div>

          <p className="text-center text-[11px] text-neutral-500 mt-12">
            10 slots per house. Includes Wi-Fi, coffee, Cafe Zomad credits, house events.
          </p>
        </div>
      </section>

      <section className="px-8 md:px-28 pb-32">
        <div className="max-w-3xl mx-auto">
          <BlurFade inView delay={0.1} direction="up">
            <div className="border border-white/10 p-8 md:p-10 text-center">
              <p className="text-[10px] tracking-[3px] uppercase text-white/40">Just visiting?</p>
              <h3 className="font-[family-name:var(--font-headline)] italic text-3xl md:text-4xl shiny-gold mt-3">
                Day Pass
              </h3>
              <p className="text-sm text-neutral-400 font-light mt-4 max-w-md mx-auto">
                Drop in. Plug in. Ship a day's worth. Works at either house.
              </p>
              <div className="mt-6 flex items-baseline justify-center gap-1">
                <span className="text-4xl md:text-5xl font-medium shiny-gold">₹420</span>
                <span className="text-xs text-neutral-500">/ day</span>
              </div>
              <Link
                href="/?apply=1"
                className="inline-block mt-8 text-[11px] tracking-[3px] uppercase py-3 px-8 border border-white/20 text-white/70 hover:border-white hover:text-white transition-colors"
              >
                Book a day
              </Link>
            </div>
          </BlurFade>
        </div>
      </section>

      <footer className="bg-black py-4 pb-28 md:pb-4 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center w-full border-t border-white/5 pt-4">
          <div className="mb-8 md:mb-0 text-center md:text-left">
            <span className="text-lg font-black text-white font-[family-name:var(--font-headline)] italic shiny-gold">
              Zo House
            </span>
            <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mt-2">
              &copy; 2026 Zo House. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            <Link className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase hover:text-white transition-opacity duration-300" href="/live">
              Live
            </Link>
            <Link className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase hover:text-white transition-opacity duration-300" href="/network">
              Network
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Build;
