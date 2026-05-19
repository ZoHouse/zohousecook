import React, { useState } from "react";
import { cn } from "../../../lib/cn";

const SYNE = "font-['Syne'] font-extrabold";
const RUBIK = "font-['Rubik']";

interface FounderInput {
  name: string;
  company: string;
  sector: string;
  pfp?: string;
}

interface SimResult {
  collaboration_score: number;
  vibe_alignment: number;
  synergy_type: string;
  predicted_venture: string;
  skill_complementarity: Record<string, string>;
  network_multiplier: number;
  why_it_works: string;
  best_scenario: string;
}

export interface SimulationFlowProps {
  founderA: FounderInput;
  founderB: FounderInput;
  eventCount: number;
  result: SimResult | null;
  loading: boolean;
}

const EVENT_TEXTS = [
  (a: string, b: string) => `${a} and ${b} cross paths in the lobby`,
  (a: string, _b: string) => `${a} shares what they're building`,
  (_a: string, b: string) => `${b} spots a pattern. stacks overlap`,
  (a: string, b: string) => `${a} and ${b} grab a whiteboard`,
  (_a: string, _b: string) => `Network effects surfacing...`,
  (_a: string, _b: string) => `Simulation converging...`,
];

const FlowAvatar: React.FC<{ name: string; pfp?: string }> = ({ name, pfp }) => {
  const [failed, setFailed] = useState(false);
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 border-2 border-white/10 overflow-hidden flex items-center justify-center shrink-0">
      {pfp && !failed ? (
        <img src={pfp} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : (
        <span className={cn("text-white/40 font-bold text-xs", SYNE)}>{initials}</span>
      )}
    </div>
  );
};

const Line: React.FC = () => (
  <div className="flex justify-center py-1">
    <div className="w-px h-8 bg-gradient-to-b from-white/10 to-white/5" />
  </div>
);

const DashedLine: React.FC = () => (
  <div className="flex justify-center py-1">
    <div className="w-px h-10 border-l border-dashed border-zui-yellow/20" />
  </div>
);

const SimulationFlow: React.FC<SimulationFlowProps> = ({
  founderA,
  founderB,
  eventCount,
  result,
  loading,
}) => {
  const fa = founderA.name.split(" ")[0];
  const fb = founderB.name.split(" ")[0];

  return (
    <div className="space-y-0">
      <div className="grid grid-cols-2 gap-4">
        {[founderA, founderB].map((f, i) => (
          <div key={i} className="p-4 rounded-xl bg-[#111] border border-white/10 text-center">
            <div className="flex justify-center mb-3">
              <FlowAvatar name={f.name} pfp={f.pfp} />
            </div>
            <p className={cn("text-sm font-bold truncate", SYNE)}>{f.name}</p>
            <p className={cn("text-[11px] text-white/30 truncate mt-0.5", RUBIK)}>{f.company || "Builder"}</p>
            {f.sector && (
              <span className={cn("inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] bg-white/5 border border-white/5 text-white/25", RUBIK)}>
                {f.sector}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="relative h-12">
        <div className="absolute left-1/4 top-0 w-px h-full bg-gradient-to-b from-white/10 to-zui-yellow/10" />
        <div className="absolute right-1/4 top-0 w-px h-full bg-gradient-to-b from-white/10 to-zui-yellow/10" />
        <div className="absolute left-1/4 right-1/4 bottom-0 h-px bg-zui-yellow/10" />
        <div className="absolute left-1/2 bottom-0 w-px h-3 bg-zui-yellow/10 -translate-x-1/2" />
      </div>

      {EVENT_TEXTS.slice(0, eventCount).map((tpl, i) => (
        <div key={i}>
          <Line />
          <div
            className="flex items-center gap-3 mx-auto max-w-[480px] px-4 py-3 rounded-lg bg-[#0d0d0d] border border-white/[0.06] animate-fadeSlideIn"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[10px] shrink-0 border",
              i === eventCount - 1 && !result
                ? "bg-zui-yellow/10 border-zui-yellow/20 text-zui-yellow/60"
                : "bg-white/5 border-white/5 text-white/30"
            )}>
              {i + 1}
            </div>
            <p className={cn("text-sm text-white/45", RUBIK)}>{tpl(fa, fb)}</p>
          </div>
        </div>
      ))}

      {loading && eventCount >= EVENT_TEXTS.length && (
        <>
          <Line />
          <div className="flex items-center gap-3 mx-auto max-w-[480px] px-4 py-3 rounded-lg bg-[#0d0d0d] border border-zui-yellow/10">
            <div className="w-7 h-7 rounded-full bg-zui-yellow/10 border border-zui-yellow/20 flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-zui-yellow animate-pulse" />
            </div>
            <p className={cn("text-sm text-zui-yellow/40 animate-pulse", RUBIK)}>Computing chemistry...</p>
          </div>
        </>
      )}

      {result && (
        <div className="animate-fadeIn">
          <DashedLine />

          <div className="mx-auto max-w-[340px] p-6 rounded-xl bg-[#111] border border-zui-yellow/15 text-center">
            <div className={cn("text-[72px] leading-none text-zui-yellow", SYNE)}>
              {result.collaboration_score}
            </div>
            <div className={cn("text-[9px] text-white/20 uppercase tracking-[3px] mt-2", RUBIK)}>Chemistry Score</div>
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: `${result.vibe_alignment}%` }} />
                </div>
                <span className={cn("text-[10px] text-white/20", RUBIK)}>{result.vibe_alignment}</span>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] border",
                result.synergy_type === "co-founder" ? "text-green-400/70 bg-green-400/5 border-green-400/15" :
                result.synergy_type === "complementary" ? "text-zui-yellow/70 bg-zui-yellow/5 border-zui-yellow/15" :
                "text-white/40 bg-white/5 border-white/10",
                RUBIK
              )}>
                {result.synergy_type}
              </span>
              <span className={cn("text-[10px] text-white/15", RUBIK)}>{result.network_multiplier.toFixed(1)}x</span>
            </div>
          </div>

          <DashedLine />

          <div className="mx-auto max-w-[520px] p-5 rounded-xl bg-gradient-to-br from-zui-yellow/[0.05] to-[#0a0a0a] border border-zui-yellow/10">
            <p className={cn("text-[8px] text-zui-yellow/40 uppercase tracking-[3px] mb-2", RUBIK)}>What they&apos;d build</p>
            <p className={cn("text-base leading-relaxed", SYNE)}>{result.predicted_venture}</p>
          </div>

          {Object.keys(result.skill_complementarity).length > 0 && (
            <>
              <Line />
              <div className="grid grid-cols-2 gap-3 max-w-[520px] mx-auto">
                {Object.entries(result.skill_complementarity).map(([who, what]) => (
                  <div key={who} className="p-4 rounded-xl bg-[#0d0d0d] border border-white/5">
                    <p className={cn("text-[8px] text-zui-yellow/30 uppercase tracking-wider mb-1.5", RUBIK)}>{who.split(" ")[0]}</p>
                    <p className={cn("text-xs text-white/40 leading-relaxed", RUBIK)}>{what}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {result.why_it_works && (
            <>
              <Line />
              <div className="mx-auto max-w-[520px] px-4">
                <p className={cn("text-sm text-white/35 leading-relaxed", RUBIK)}>
                  <span className="text-green-400/50 mr-1.5">↗</span>{result.why_it_works}
                </p>
              </div>
            </>
          )}

          {result.best_scenario && (
            <div className="mx-auto max-w-[520px] px-4 mt-3">
              <p className={cn("text-xs text-white/20 italic leading-relaxed", RUBIK)}>
                Best case. {result.best_scenario}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimulationFlow;
