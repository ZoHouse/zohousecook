import React, { useMemo, useState } from "react";
import { useQueryApi } from "@zo/auth";
import { cn } from "@zo/utils/font";
import { isValidString } from "@zo/utils/string";
import alumniPageData, { filterPills, AlumniMember } from "../../../config/alumni";
import { useFadeInOnScroll } from "../../../hooks";
import { rubikClassName, syneClassName } from "../../utils/font";

const AVATAR_CDN = "https://proxy.cdn.zo.xyz/avatars";

type FounderNft = {
  token_ref_id: string;
  nickname: string;
  pfp_image: string;
  tags: string[];
};

const AlumniDirectory: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();
  const [activeFilter, setActiveFilter] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const { data: apiFounders } = useQueryApi<FounderNft[]>(
    "WEBTHREE_FOUNDER_NFTS",
    {
      select: (data: any) => data.data,
      refetchOnWindowFocus: false,
    },
    "",
    "limit=500"
  );

  const curatedNicknames = useMemo(
    () => new Set(alumniPageData.curated.map((m) => m.nickname)),
    []
  );

  const filteredCurated = useMemo(() => {
    const predicate = filterPills[activeFilter].predicate;
    return alumniPageData.curated.filter(predicate);
  }, [activeFilter]);

  const apiTier = useMemo(() => {
    if (activeFilter !== 0) return [];
    return (
      apiFounders?.filter(
        (f) => isValidString(f.nickname) && !curatedNicknames.has(f.nickname)
      ) || []
    );
  }, [apiFounders, activeFilter, curatedNicknames]);

  const allDisplay = [...filteredCurated.map((m) => ({ type: "curated" as const, data: m }))];
  if (activeFilter === 0) {
    apiTier.forEach((f) =>
      allDisplay.push({ type: "api" as const, data: f as any })
    );
  }

  const totalCount = (apiFounders?.length || 0) + alumniPageData.curated.filter(
    (m) => !apiFounders?.some((f) => f.nickname === m.nickname)
  ).length;
  const displayed = showAll ? allDisplay : allDisplay.slice(0, 24);

  return (
    <section ref={sectionRef} className="snap-start py-24 px-6 max-w-[1100px] mx-auto">
      <p className={cn("text-xs text-zui-yellow uppercase tracking-[3px] mb-3", rubikClassName)}>
        The Network
      </p>
      <h2 className={cn("text-[32px] md:text-[56px] font-extrabold leading-tight", syneClassName)}>
        All <span className="text-white/30">{totalCount}+</span>
      </h2>
      <p className={cn("text-white/40 text-sm max-w-[400px] mt-2 mb-8", rubikClassName)}>
        Every builder who's part of the Zo House network.
      </p>

      <div className="flex gap-2 flex-wrap mb-8">
        {filterPills.map((pill, i) => (
          <button
            key={pill.label}
            onClick={() => { setActiveFilter(i); setShowAll(false); }}
            className={cn(
              "text-xs px-4 py-2 rounded-full border transition-all",
              i === activeFilter
                ? "bg-zui-yellow border-zui-yellow text-black font-medium"
                : "border-white/10 text-white/50 hover:border-white/30 hover:text-white/80"
            )}
          >
            {pill.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-px bg-white/[0.04] rounded-xl overflow-hidden">
        {displayed.map((item, i) => {
          if (item.type === "curated") {
            const m = item.data as AlumniMember;
            return (
              <div key={m.nickname} className="bg-black p-4 text-center hover:bg-[rgba(255,214,0,0.02)] transition-colors">
                <div className="w-14 h-14 rounded-full mx-auto mb-2 bg-gradient-to-br from-neutral-800 to-neutral-600 border-2 border-transparent hover:border-zui-yellow transition-colors overflow-hidden flex items-center justify-center">
                  <img
                    src={`${AVATAR_CDN}/${m.nickname}.png?w=112`}
                    alt={m.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.parentElement!.innerHTML = `<span class="text-white/40 font-bold text-xs">${m.name.split(" ").map((n) => n[0]).join("")}</span>`;
                    }}
                  />
                </div>
                <div className={cn("text-xs font-semibold truncate", syneClassName)}>{m.name}</div>
                <div className="text-[10px] text-white/40 truncate">{m.company}</div>
                {m.fundingAmount && (
                  <span className="inline-block mt-1 text-[8px] uppercase tracking-[0.5px] px-2 py-0.5 rounded bg-[rgba(255,214,0,0.1)] text-zui-yellow">
                    {m.fundingAmount}
                  </span>
                )}
              </div>
            );
          } else {
            const f = item.data as FounderNft;
            return (
              <div key={f.nickname || i} className="bg-black p-4 text-center hover:bg-[rgba(255,214,0,0.02)] transition-colors">
                <div className="w-14 h-14 rounded-full mx-auto mb-2 bg-gradient-to-br from-neutral-800 to-neutral-600 border-2 border-transparent overflow-hidden flex items-center justify-center">
                  <img
                    src={`${AVATAR_CDN}/${f.nickname}.png?w=112`}
                    alt={f.nickname}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      if (f.pfp_image) {
                        const img = new Image();
                        img.src = f.pfp_image;
                        img.className = "w-full h-full object-cover";
                        target.parentElement!.appendChild(img);
                      } else {
                        target.parentElement!.innerHTML = `<span class="text-white/40 font-bold text-xs">${(f.nickname || "?")[0].toUpperCase()}</span>`;
                      }
                    }}
                  />
                </div>
                <div className={cn("text-xs font-semibold truncate", syneClassName)}>{f.nickname}</div>
              </div>
            );
          }
        })}
      </div>

      {!showAll && allDisplay.length > 24 && (
        <div className="text-center mt-6">
          <button
            onClick={() => setShowAll(true)}
            className={cn("text-zui-yellow text-sm hover:underline", rubikClassName)}
          >
            View all {totalCount}+ members →
          </button>
        </div>
      )}
    </section>
  );
};

export default AlumniDirectory;
