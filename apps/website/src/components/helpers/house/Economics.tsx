import { cn } from "@zo/utils/font";
import React from "react";
import { useFadeInOnScroll } from "../../../hooks";
import { rubikClassName, syneClassName } from "../../utils/font";

const Economics: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section
      ref={sectionRef}
      className="mt-20 md:mt-[120px] border border-transparent rounded-2xl rotating-gradient-border inner-border"
    >
      <div className="relative z-10 bg-zui-dark p-6 md:px-16 md:py-14 m-0.5 rounded-xl">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10">
          {/* Left */}
          <div className="flex-1">
            <h2
              className={cn(
                "sub-heading-2 font-bold",
                syneClassName
              )}
            >
              Zero dilution
              <br />
              <span className="text-zui-yellow">entry point.</span>
            </h2>
            <p
              className={cn(
                "mt-6 text-base md:text-lg text-zui-white/70 leading-relaxed max-w-[480px]",
                rubikClassName
              )}
            >
              Unlike HF0 (5%) or YC (7%), Zo&apos;s primary model is a success
              fee — not equity. Founders who bootstrap or don&apos;t raise never
              pay anything beyond rent.
            </p>
            <p
              className={cn(
                "mt-4 text-base md:text-lg text-zui-white/70 leading-relaxed max-w-[480px]",
                rubikClassName
              )}
            >
              A founder with $50K in savings can operate in Bangalore for ~3
              years vs. only 7 months in SF. That&apos;s not a cost saving —
              it&apos;s a strategic advantage.
            </p>
          </div>

          {/* Right — deal terms */}
          <div className="w-full md:w-auto space-y-6">
            {[
              {
                label: "Success Fee",
                value: "4.2%",
                detail: "of capital raised within 24 months",
              },
              {
                label: "Monthly Rent",
                value: "₹15–25K",
                detail: "subsidized co-living rate",
              },
              {
                label: "Equity Model",
                value: "1.11%",
                detail: "for full incubation track",
              },
              {
                label: "Upfront Cost",
                value: "₹0",
                detail: "zero cost to the founder",
              },
            ].map((term) => (
              <div key={term.label} className="flex items-center gap-4">
                <div className="min-w-[80px] md:min-w-[100px]">
                  <span
                    className={cn(
                      "text-2xl md:text-3xl font-bold text-zui-yellow",
                      rubikClassName
                    )}
                  >
                    {term.value}
                  </span>
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold text-zui-white",
                      rubikClassName
                    )}
                  >
                    {term.label}
                  </p>
                  <p
                    className={cn(
                      "text-xs text-zui-white/40",
                      rubikClassName
                    )}
                  >
                    {term.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison bar */}
        <div className="mt-10 pt-6 border-t border-zui-white/5">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16">
            <div className="text-center">
              <p
                className={cn(
                  "text-2xl font-bold text-zui-yellow",
                  rubikClassName
                )}
              >
                ₹25K/mo
              </p>
              <p
                className={cn(
                  "text-xs text-zui-white/40 mt-1",
                  rubikClassName
                )}
              >
                Zo House + mentors + curriculum + community + demo day
              </p>
            </div>
            <span className="text-zui-white/20 text-2xl font-light">vs</span>
            <div className="text-center">
              <p
                className={cn(
                  "text-2xl font-bold text-zui-white/30",
                  rubikClassName
                )}
              >
                ₹80K/mo
              </p>
              <p
                className={cn(
                  "text-xs text-zui-white/20 mt-1",
                  rubikClassName
                )}
              >
                Mediocre flat in Koramangala with no network
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Economics;
