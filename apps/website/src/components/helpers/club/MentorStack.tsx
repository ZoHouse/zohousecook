import React, { useMemo } from "react";
import { cn } from "@zo/utils/font";
import alumniPageData from "../../../config/alumni";
import { useFadeInOnScroll } from "../../../hooks";
import { rubikClassName, syneClassName } from "../../utils/font";

const AVATAR_CDN = "https://proxy.cdn.zo.xyz/avatars";

const MentorStack: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();
  const mentors = useMemo(
    () => alumniPageData.curated.filter((m) => m.mentorStack),
    []
  );

  return (
    <section ref={sectionRef} className="snap-center py-24 px-6 max-w-[1100px] mx-auto">
      <p className={cn("text-xs text-zui-yellow uppercase tracking-[3px] mb-3", rubikClassName)}>
        Built-in, not bolted on
      </p>
      <h2 className={cn("text-[32px] md:text-[56px] font-extrabold leading-tight", syneClassName)}>
        The Mentor Stack
      </h2>
      <p className={cn("text-white/40 text-base max-w-[550px] mt-2 mb-10", rubikClassName)}>
        Fund managers, serial founders, and operators inside the network. Mentorship at Zo House is lived-in, not scheduled.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.04] rounded-xl overflow-hidden">
        {mentors.map((mentor) => (
          <div
            key={mentor.nickname}
            className="bg-black p-6 md:p-8 text-center hover:bg-[rgba(255,214,0,0.02)] transition-colors"
          >
            <div className="w-[72px] h-[72px] rounded-full mx-auto mb-4 bg-gradient-to-br from-neutral-800 to-neutral-600 border-2 border-[rgba(255,214,0,0.2)] flex items-center justify-center overflow-hidden">
              <img
                src={`${AVATAR_CDN}/${mentor.nickname}.png?w=144`}
                alt={mentor.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.parentElement!.innerHTML = `<span class="${syneClassName} text-zui-yellow font-bold text-lg">${mentor.name.split(" ").map((n) => n[0]).join("")}</span>`;
                }}
              />
            </div>
            <h3 className={cn("font-bold text-base", syneClassName)}>{mentor.name}</h3>
            <p className="text-zui-yellow text-sm mt-1">{mentor.mentorRole}</p>
            <p className={cn("text-white/40 text-xs mt-3 leading-relaxed", rubikClassName)}>
              {mentor.mentorDescription}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MentorStack;
