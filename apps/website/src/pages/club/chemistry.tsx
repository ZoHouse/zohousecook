import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { MetaTags, Page } from "../../components/common";
import { useQueryApi } from "@zo/auth";
import { cn } from "@zo/utils/font";
import Link from "next/link";
import alumniPageData from "../../config/alumni";
import founderPfps from "../../config/founder-pfps";
import { fixAvatarUrl } from "../../components/helpers/club/utils";
import dynamic from "next/dynamic";

const SimulationFlow = dynamic(
  () => import("../../components/helpers/club/SimulationFlow"),
  { ssr: false }
);

const SYNE = "font-['Syne'] font-extrabold";
const RUBIK = "font-['Rubik']";
const CHEMISTRY_API = "https://chemistry.zozozo.work";

interface Founder {
  slug: string;
  name: string;
  company: string;
  sector: string;
  tier: string;
  one_liner: string;
  skills: string[];
  twitter: string;
  funding: string;
}

interface FounderWithPfp extends Founder {
  pfp?: string;
}

interface SimResult {
  founder_a: string;
  founder_b: string;
  collaboration_score: number;
  vibe_alignment: number;
  synergy_type: string;
  predicted_venture: string;
  skill_complementarity: Record<string, string>;
  network_multiplier: number;
  why_it_works: string;
  why_it_might_not: string;
  best_scenario: string;
}

type NftHolder = { nickname: string; pfp_image: string };

// ─── Avatar ───────────────────────────────────────────────────────────────────

const Avatar: React.FC<{ name: string; pfp?: string; size?: string }> = ({ name, pfp, size = "w-16 h-16" }) => {
  const [failed, setFailed] = useState(false);
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const src = fixAvatarUrl(pfp);

  return (
    <div className={cn(size, "rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 border-2 border-white/10 overflow-hidden flex items-center justify-center shrink-0")}>
      {src && !failed ? (
        <img src={src} alt={name} referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span className={cn("text-white/40 font-bold text-sm", SYNE)}>{initials}</span>
      )}
    </div>
  );
};

// ─── Founder Card ─────────────────────────────────────────────────────────────

const FounderCard: React.FC<{
  founder: FounderWithPfp;
  onClear: () => void;
  side: "left" | "right";
}> = ({ founder, onClear, side }) => (
  <div
    className="relative w-full rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 h-[320px] flex flex-col animate-dealCard"
    style={{ animationDelay: side === "right" ? "0.12s" : "0s" }}
  >
    <button
      onClick={onClear}
      className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 text-white/25 text-xs flex items-center justify-center hover:bg-white/10 hover:text-white/50 transition-all"
    >
      ✕
    </button>

    {/* PFP */}
    <Avatar name={founder.name} pfp={founder.pfp} size="w-[72px] h-[72px]" />

    {/* Name */}
    <h3 className={cn("mt-4 text-xl leading-tight", SYNE)}>{founder.name}</h3>
    <p className={cn("text-sm text-white/30 mt-0.5 line-clamp-1", RUBIK)}>
      {founder.company || founder.one_liner || "Builder"}
    </p>

    {/* Tags */}
    <div className="mt-auto pt-4 flex flex-wrap gap-1.5">
      {founder.sector && (
        <span className={cn("px-2.5 py-1 rounded-full text-[10px] bg-white/5 border border-white/5 text-white/30", RUBIK)}>
          {founder.sector}
        </span>
      )}
      {founder.funding && (
        <span className={cn("px-2.5 py-1 rounded-full text-[10px] bg-zui-yellow/5 border border-zui-yellow/10 text-zui-yellow/50", RUBIK)}>
          {founder.funding}
        </span>
      )}
      {founder.skills.slice(0, 2).map((s) => (
        <span key={s} className={cn("px-2.5 py-1 rounded-full text-[10px] bg-white/[0.02] border border-white/[0.03] text-white/15", RUBIK)}>
          {s}
        </span>
      ))}
    </div>
  </div>
);

// ─── Search ───────────────────────────────────────────────────────────────────

const FounderSearch: React.FC<{
  placeholder: string;
  founders: FounderWithPfp[];
  onSelect: (f: FounderWithPfp) => void;
}> = ({ placeholder, founders, onSelect }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = query
    ? founders.filter((f) =>
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.company.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  return (
    <div ref={ref} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={cn("w-full px-5 py-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-white/15 outline-none focus:border-zui-yellow/30 transition-all text-sm", RUBIK)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-2 w-full bg-[#0a0a0a] border border-white/10 rounded-xl max-h-[280px] overflow-y-auto">
          {filtered.map((f) => (
            <button
              key={f.slug}
              onClick={() => { onSelect(f); setOpen(false); setQuery(""); }}
              className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/[0.03] last:border-0 transition-colors flex items-center gap-3"
            >
              <Avatar name={f.name} pfp={f.pfp} size="w-8 h-8" />
              <div>
                <span className={cn("text-sm font-bold", SYNE)}>{f.name}</span>
                {f.company && <span className={cn("text-xs text-white/20 ml-2", RUBIK)}>{f.company}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Simulation Thread ────────────────────────────────────────────────────────

const threadSteps = [
  { tpl: (a: string, b: string) => `${a} and ${b} cross paths in the Zo House lobby` },
  { tpl: (a: string, _b: string) => `${a} shares what they're building — ${_b} leans in` },
  { tpl: (_a: string, b: string) => `${b} spots an overlap. "We should talk."` },
  { tpl: (a: string, b: string) => `${a} and ${b} grab a whiteboard. Ideas start flowing.` },
  { tpl: (_a: string, _b: string) => `Network effects kicking in — mutual connections surface` },
  { tpl: (_a: string, _b: string) => `The simulation converges on an outcome...` },
];

const SimThread: React.FC<{
  a: string;
  b: string;
  count: number;
  done: boolean;
  result: SimResult | null;
  onSimulate: () => void;
  loading: boolean;
  started: boolean;
}> = ({ a, b, count, done, result, onSimulate, loading, started }) => {
  const fa = a.split(" ")[0];
  const fb = b.split(" ")[0];

  return (
    <div className="mt-10 relative">
      {/* Simulate button */}
      {!started && (
        <div className="flex justify-center py-2">
          <button
            onClick={onSimulate}
            disabled={loading}
            className={cn(
              "px-8 py-4 rounded-xl bg-zui-yellow text-black font-bold hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,214,0,0.2)] transition-all",
              SYNE
            )}
          >
            Simulate
          </button>
        </div>
      )}

      {/* Vertical line — only show during/after simulation */}
      {started && (
        <div className="absolute left-[15px] top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent pointer-events-none" />
      )}

      {/* Thread events */}
      {threadSteps.slice(0, count).map((step, i) => (
        <div
          key={i}
          className="relative flex items-start gap-4 pb-5 animate-fadeSlideIn"
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          {/* Node dot */}
          <div className={cn(
            "relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs transition-all",
            i === count - 1 && !done
              ? "bg-white/5 border border-white/10 text-white/20"
              : "bg-white/[0.08] border border-white/10 text-white/40"
          )}>
            {i + 1}
          </div>

          {/* Event text */}
          <p className={cn(
            "text-sm leading-relaxed pt-1.5",
            i === count - 1 && !done ? "text-white/20" : "text-white/45",
            RUBIK
          )}>
            {step.tpl(fa, fb)}
          </p>
        </div>
      ))}

      {/* Loading pulse */}
      {loading && count >= threadSteps.length && (
        <div className="relative flex items-start gap-4 pb-5">
          <div className="relative z-10 w-8 h-8 rounded-full bg-zui-yellow/10 border border-zui-yellow/20 flex items-center justify-center shrink-0">
            <div className="w-2 h-2 rounded-full bg-zui-yellow animate-pulse" />
          </div>
          <p className={cn("text-sm text-zui-yellow/40 pt-1.5 animate-pulse", RUBIK)}>
            Computing chemistry...
          </p>
        </div>
      )}

      {/* Result node */}
      {result && (
        <div className="relative animate-fadeIn">
          {/* Score node */}
          <div className="relative flex items-start gap-4 pb-2">
            <div className="relative z-10 w-8 h-8 rounded-full bg-zui-yellow/20 border border-zui-yellow/30 flex items-center justify-center shrink-0">
              <span className="text-zui-yellow text-xs">✦</span>
            </div>
            <div className="pt-0.5">
              <div className="flex items-baseline gap-3">
                <span className={cn("text-[56px] leading-none text-zui-yellow", SYNE)}>
                  {result.collaboration_score}
                </span>
                <div>
                  <div className={cn("text-[10px] text-white/20 uppercase tracking-[3px]", RUBIK)}>Chemistry</div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-400 rounded-full" style={{ width: `${result.vibe_alignment}%` }} />
                      </div>
                      <span className={cn("text-[10px] text-white/20", RUBIK)}>{result.vibe_alignment}</span>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] border",
                      result.synergy_type === "complementary" ? "text-zui-yellow/60 bg-zui-yellow/5 border-zui-yellow/15" :
                      result.synergy_type === "co-founder" ? "text-green-400/60 bg-green-400/5 border-green-400/15" :
                      "text-white/30 bg-white/5 border-white/10",
                      RUBIK
                    )}>
                      {result.synergy_type}
                    </span>
                    <span className={cn("text-[10px] text-white/15", RUBIK)}>{result.network_multiplier.toFixed(1)}x</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Venture */}
          <div className="relative flex items-start gap-4 py-4">
            <div className="w-8 shrink-0" />
            <div className="flex-1 p-5 rounded-xl bg-gradient-to-br from-zui-yellow/[0.06] to-transparent border border-zui-yellow/10">
              <p className={cn("text-[9px] text-zui-yellow/40 uppercase tracking-[3px] mb-2", RUBIK)}>What they'd build</p>
              <p className={cn("text-base leading-relaxed", SYNE)}>{result.predicted_venture}</p>
            </div>
          </div>

          {/* Skills */}
          {Object.keys(result.skill_complementarity).length > 0 && (
            <div className="relative flex items-start gap-4 pb-4">
              <div className="w-8 shrink-0" />
              <div className="flex-1 grid grid-cols-2 gap-2">
                {Object.entries(result.skill_complementarity).map(([who, what]) => (
                  <div key={who} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className={cn("text-[9px] text-zui-yellow/30 uppercase tracking-wider mb-1", RUBIK)}>{who.split(" ")[0]}</p>
                    <p className={cn("text-xs text-white/40 leading-relaxed", RUBIK)}>{what}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Why */}
          {result.why_it_works && (
            <div className="relative flex items-start gap-4 pb-3">
              <div className="w-8 shrink-0" />
              <p className={cn("text-sm text-white/30 leading-relaxed", RUBIK)}>
                <span className="text-green-400/40 mr-1">↗</span>{result.why_it_works}
              </p>
            </div>
          )}

          {/* Best scenario */}
          {result.best_scenario && (
            <div className="relative flex items-start gap-4">
              <div className="w-8 shrink-0" />
              <p className={cn("text-xs text-white/15 italic leading-relaxed", RUBIK)}>
                Best case — {result.best_scenario}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


// ─── Page ─────────────────────────────────────────────────────────────────────

const ChemistryPage: React.FC = () => {
  const [founders, setFounders] = useState<FounderWithPfp[]>([]);
  const [founderA, setFounderA] = useState<FounderWithPfp | null>(null);
  const [founderB, setFounderB] = useState<FounderWithPfp | null>(null);
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [timelineCount, setTimelineCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch NFT holders for PFPs
  const { data: nftHolders } = useQueryApi<NftHolder[]>(
    "WEBTHREE_FOUNDER_NFTS",
    { select: (d: any) => d.data, refetchOnWindowFocus: false },
    "", "limit=500"
  );

  // Build PFP lookup from static map + curated alumni + NFT holders
  const pfpLookup = useMemo(() => {
    const map: Record<string, string> = { ...founderPfps };
    const add = (key: string, url: string) => {
      if (key && url) map[key.toLowerCase().trim()] = url;
    };

    alumniPageData.curated.forEach((m) => {
      const url = m.photo || m.pfp || "";
      if (!url) return;
      add(m.name, url);
      add(m.nickname, url);
      const first = m.name.split(" ")[0];
      if (first && first.length > 2 && !map[first.toLowerCase()]) add(first, url);
      add(m.name.replace(/\s+/g, ""), url);
    });

    nftHolders?.forEach((n) => {
      if (!n.pfp_image || !n.nickname) return;
      add(n.nickname, n.pfp_image);
      const cleaned = n.nickname.replace(/\.eth$/i, "").replace(/[^a-zA-Z0-9]/g, "");
      add(cleaned, n.pfp_image);
    });

    return map;
  }, [nftHolders]);

  // Find PFP for a founder using fuzzy matching
  const findPfp = useCallback((f: Founder): string | undefined => {
    const lookup = pfpLookup;
    // Exact name
    const nameKey = f.name.toLowerCase().trim();
    if (lookup[nameKey]) return lookup[nameKey];
    // Name without spaces
    if (lookup[nameKey.replace(/\s+/g, "")]) return lookup[nameKey.replace(/\s+/g, "")];
    // First name only (for unique first names)
    const first = f.name.split(" ")[0]?.toLowerCase();
    if (first && first.length > 2 && lookup[first]) return lookup[first];
    // Slug (without leading numbers like "01-")
    const cleanSlug = f.slug.replace(/^\d+-/, "").replace(/-/g, "");
    if (lookup[cleanSlug]) return lookup[cleanSlug];
    // Twitter handle without @
    if (f.twitter) {
      const handle = f.twitter.replace(/^@/, "").toLowerCase().split(" ")[0];
      if (lookup[handle]) return lookup[handle];
    }
    // Last resort: try each word in the name
    for (const word of f.name.toLowerCase().split(" ")) {
      if (word.length > 3 && lookup[word]) return lookup[word];
    }
    return undefined;
  }, [pfpLookup]);

  // Fetch founders from Chemistry API and merge PFPs
  useEffect(() => {
    fetch(`${CHEMISTRY_API}/api/founders?limit=500`)
      .then((r) => r.json())
      .then((d) => {
        const list: FounderWithPfp[] = (d.founders || []).map((f: Founder) => ({
          ...f,
          pfp: findPfp(f),
        }));
        setFounders(list);
      })
      .catch(() => {});
  }, [pfpLookup, findPfp]);

  const simulate = useCallback(async () => {
    if (!founderA || !founderB) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setTimelineCount(0);

    // Animate timeline
    for (let i = 1; i <= threadSteps.length; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setTimelineCount(i);
    }

    try {
      const resp = await fetch(`${CHEMISTRY_API}/api/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ founder_a: founderA.slug, founder_b: founderB.slug }),
      });
      if (!resp.ok) throw new Error((await resp.json()).detail || "Simulation failed");
      setResult(await resp.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [founderA, founderB]);

  const reset = () => {
    setFounderA(null);
    setFounderB(null);
    setResult(null);
    setError(null);
    setTimelineCount(0);
  };

  const bothSelected = founderA && founderB;

  return (
    <Page className="bg-black !max-w-none !px-0 !pt-0">
      <MetaTags title="Founder Chemistry — Zo House" description="Simulate what happens when one founder meets another." />

      <div className="min-h-screen px-6 py-16 md:py-24">
        <div className="max-w-[860px] mx-auto">
          {/* Nav */}
          <Link href="/club" className={cn("text-[10px] text-white/15 uppercase tracking-[3px] hover:text-white/30 transition-colors", RUBIK)}>
            ← Club
          </Link>

          {/* Header */}
          <h1 className={cn("mt-8 text-[32px] md:text-[48px] leading-[1.05]", SYNE)}>
            Founder <span className="text-zui-yellow">Chemistry</span>
          </h1>
          <p className={cn("mt-2 text-sm text-white/25", RUBIK)}>
            Simulate what happens when one founder meets another.
          </p>

          {/* Cards + Simulate — before simulation starts */}
          {bothSelected && timelineCount === 0 && (
            <>
              <div className="mt-10 grid grid-cols-2 gap-4 md:gap-6">
                <FounderCard founder={founderA!} side="left" onClear={() => { setFounderA(null); setResult(null); setTimelineCount(0); }} />
                <FounderCard founder={founderB!} side="right" onClear={() => { setFounderB(null); setResult(null); setTimelineCount(0); }} />
              </div>
              <div className="mt-8 flex justify-center">
                <button
                  onClick={simulate}
                  disabled={loading}
                  className={cn("px-8 py-4 rounded-xl bg-zui-yellow text-black font-bold hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(255,214,0,0.2)] transition-all", SYNE)}
                >
                  Simulate
                </button>
              </div>
            </>
          )}

          {/* Rolodex — pick from the grid */}
          {!bothSelected && (
            <div className="mt-10">
              {/* Search bar */}
              <FounderSearch
                placeholder={!founderA ? "Search founders..." : "Now pick the second..."}
                founders={founders.filter((f) => f.slug !== founderA?.slug)}
                onSelect={!founderA ? setFounderA : setFounderB}
              />

              {/* Selected A — show as mini card above the grid */}
              {founderA && (
                <div className="mt-4 mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-zui-yellow/10">
                  <Avatar name={founderA.name} pfp={founderA.pfp} size="w-10 h-10" />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-bold truncate", SYNE)}>{founderA.name}</p>
                    <p className={cn("text-[11px] text-white/25 truncate", RUBIK)}>{founderA.company || founderA.sector}</p>
                  </div>
                  <button onClick={() => setFounderA(null)} className="text-white/20 hover:text-white/40 text-xs">✕</button>
                  <span className={cn("text-[10px] text-zui-yellow/40 uppercase tracking-wider", RUBIK)}>vs ?</span>
                </div>
              )}

              {/* Prompt */}
              <p className={cn("text-[10px] text-white/15 uppercase tracking-[3px] mb-5 mt-6", RUBIK)}>
                {!founderA ? "Pick a founder" : "Now pick their match"}
              </p>

              {/* Directory grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {founders
                  .filter((f) => f.slug !== founderA?.slug)
                  .slice(0, 60)
                  .map((f) => (
                    <button
                      key={f.slug}
                      onClick={() => !founderA ? setFounderA(f) : setFounderB(f)}
                      className="text-left p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-zui-yellow/20 hover:bg-white/[0.04] transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar name={f.name} pfp={f.pfp} size="w-14 h-14" />
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-base font-bold truncate group-hover:text-zui-yellow transition-colors", SYNE)}>
                            {f.name}
                          </p>
                          <p className={cn("text-xs text-white/25 truncate mt-0.5", RUBIK)}>
                            {f.company || f.one_liner || "Builder"}
                          </p>
                          {(f.sector || f.funding) && (
                            <div className="mt-2 flex gap-1.5 flex-wrap">
                              {f.sector && (
                                <span className={cn("px-2 py-0.5 rounded-full text-[9px] bg-white/[0.03] text-white/20 border border-white/[0.04]", RUBIK)}>
                                  {f.sector}
                                </span>
                              )}
                              {f.funding && (
                                <span className={cn("px-2 py-0.5 rounded-full text-[9px] bg-zui-yellow/5 text-zui-yellow/30 border border-zui-yellow/10", RUBIK)}>
                                  {f.funding}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>

              {founders.length > 60 && (
                <p className={cn("text-center text-[10px] text-white/10 mt-4", RUBIK)}>
                  {founders.length - 60}+ more — use search
                </p>
              )}
            </div>
          )}

          {/* React Flow simulation — during and after */}
          {bothSelected && timelineCount > 0 && (
            <div className="mt-8">
              <SimulationFlow
                founderA={{ name: founderA!.name, company: founderA!.company, sector: founderA!.sector, pfp: founderA!.pfp }}
                founderB={{ name: founderB!.name, company: founderB!.company, sector: founderB!.sector, pfp: founderB!.pfp }}
                eventCount={timelineCount}
                result={result}
                loading={loading}
              />
            </div>
          )}

          {error && <p className={cn("mt-6 text-red-400/50 text-sm text-center", RUBIK)}>{error}</p>}

          {/* Reset */}
          {result && (
            <div className="mt-10 flex justify-center">
              <button onClick={reset} className={cn("px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-all", RUBIK)}>
                Try another pair
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes dealCard { from { opacity:0; transform:translateY(24px) scale(0.96) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateX(-6px) } to { opacity:1; transform:translateX(0) } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards }
        .animate-dealCard { animation: dealCard 0.35s ease-out forwards }
        .animate-fadeSlideIn { animation: fadeSlideIn 0.25s ease-out forwards }
      `}</style>
    </Page>
  );
};

export default ChemistryPage;
