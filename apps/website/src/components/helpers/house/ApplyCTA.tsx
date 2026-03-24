import { cn } from "@zo/utils/font";
import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { Button } from "../../ui";
import { rubikClassName, syneClassName } from "../../utils/font";

const APPLY_URL = "https://zostel.typeform.com/to/LgcBfa0M";

const ApplyCTA: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  const handleApply = () => {
    window.open(APPLY_URL, "_blank");
  };

  return (
    <section
      ref={sectionRef}
      className="mt-20 md:mt-[120px] mb-20 md:mb-[120px] relative overflow-hidden rounded-2xl inner-border"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zui-dark via-zui-light to-zui-dark" />
      <div className="blob" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center py-16 md:py-24 px-6">
        <h2
          className={cn(
            "text-3xl md:text-[56px] md:leading-[72px] font-bold",
            syneClassName
          )}
        >
          Cohort 1 starts{" "}
          <span className="text-zui-yellow">April 6, 2026.</span>
        </h2>
        <p
          className={cn(
            "mt-4 text-base md:text-lg text-zui-white/50 max-w-[500px]",
            rubikClassName
          )}
        >
          14 spots across CC0 (Crypto) and duh.zo (AI/Hardware) at WTFxZo.
          Applications reviewed on a rolling basis.
        </p>

        <div className="flex flex-col md:flex-row items-center gap-4 mt-10">
          <Button onClick={handleApply} type="primary" className="w-[240px]">
            Apply Now
          </Button>
          <Button
            onClick={() => {
              window.open("https://t.me/BLRxZo", "_blank");
            }}
            type="secondary"
            className="w-[240px]"
          >
            Join Telegram
          </Button>
        </div>

        <div
          className={cn(
            "flex flex-col md:flex-row items-center gap-4 md:gap-8 mt-10 text-sm text-zui-white/40",
            rubikClassName
          )}
        >
          <span>zo.xyz</span>
          <span className="hidden md:inline w-1 h-1 rounded-full bg-zui-white/20" />
          <span>t.me/BLRxZo</span>
          <span className="hidden md:inline w-1 h-1 rounded-full bg-zui-white/20" />
          <span>@zohouseofficial</span>
          <span className="hidden md:inline w-1 h-1 rounded-full bg-zui-white/20" />
          <span>@samuraizan</span>
        </div>
      </div>
    </section>
  );
};

export default ApplyCTA;
