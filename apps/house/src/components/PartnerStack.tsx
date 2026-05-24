import { useState } from "react";

import { BlurFade } from "./helpers/house/BlurFade";

// Partners that back the founders and builders at Zo House. Each tile prefers
// a local logo file from /public/partners/<slug>.svg; if that file is missing
// it falls back to the partner's favicon via Google's S2 API (always returns
// something for any reachable domain); if even that fails it renders the
// partner name as a wordmark. Drop SVG files into apps/house/public/partners/
// to swap in proper brand logos.

type Partner = {
  name: string;
  url: string;
  domain: string;
  slug: string;
  // Optional override for the local logo filename (defaults to `${slug}.svg`).
  // Set this when the file is PNG/WebP instead of SVG.
  logo?: string;
};

const PARTNERS: Partner[] = [
  { name: "Emergent", url: "https://app.emergent.sh/home", domain: "emergent.sh", slug: "emergent", logo: "emergent.png" },
  { name: "Together Fund", url: "https://together.fund", domain: "together.fund", slug: "together-fund" },
  { name: "Boundless Ventures", url: "https://www.boundlessvc.com", domain: "boundlessvc.com", slug: "boundless-ventures" },
  { name: "Hashed Emergent", url: "https://hashedem.com", domain: "hashedem.com", slug: "hashed-emergent" },
  { name: "Jarvis Labs", url: "https://jarvislabs.ai", domain: "jarvislabs.ai", slug: "jarvis-labs" },
  { name: "Devfolio", url: "https://devfolio.co", domain: "devfolio.co", slug: "devfolio" },
  { name: "Runable", url: "https://runable.com", domain: "runable.com", slug: "runable" },
  { name: "Nebius", url: "https://nebius.com", domain: "nebius.com", slug: "nebius" },
];

type Stage = "local" | "favicon" | "text";

function PartnerCard({ name, url, domain, slug, logo }: Partner) {
  const [stage, setStage] = useState<Stage>("local");
  const src =
    stage === "local"
      ? `/partners/${logo ?? `${slug}.svg`}`
      : stage === "favicon"
      ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
      : null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${name} — opens in a new tab`}
      className="group grid place-items-center text-center border border-white/10 bg-gradient-to-b from-neutral-950/30 to-black hover:border-[#c5a572]/40 hover:from-[#c5a572]/[0.04] hover:to-black transition-colors p-6 md:p-8 min-h-[88px] md:min-h-[112px]"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setStage(stage === "local" ? "favicon" : "text")}
          className="max-h-12 md:max-h-14 w-auto opacity-80 group-hover:opacity-100 transition-opacity duration-300"
        />
      ) : (
        <span className="text-sm md:text-base font-medium tracking-tight text-white/60 group-hover:text-[#c5a572] transition-colors">
          {name}
        </span>
      )}
    </a>
  );
}

export function PartnerStack() {
  return (
    <section className="relative px-5 md:px-10 lg:px-20 pb-14 md:pb-20">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      <div className="max-w-6xl mx-auto pt-12 md:pt-16">
        <BlurFade inView delay={0.05} direction="up">
          <div className="text-center max-w-2xl mx-auto mb-7 md:mb-10">
            <p className="text-[9px] md:text-[10px] tracking-[3px] uppercase text-white/40 font-mono">
              Partner stack
            </p>
            <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-medium tracking-tight leading-[1.1]">
              The stack{" "}
              <span className="font-[family-name:var(--font-headline)] italic font-normal shiny-gold">
                behind the build
              </span>
            </h2>
            <p className="mt-3 text-[11px] md:text-xs text-neutral-400 font-light leading-relaxed">
              Compute, capital, and community partners backing the founders living and building at Zo House.
            </p>
          </div>
        </BlurFade>
        <BlurFade inView delay={0.15} direction="up">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {PARTNERS.map((p) => (
              <PartnerCard key={p.name} {...p} />
            ))}
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
