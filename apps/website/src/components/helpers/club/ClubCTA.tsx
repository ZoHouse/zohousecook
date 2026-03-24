import React from "react";
import { cn } from "@zo/utils/font";
import Link from "next/link";
import { useFadeInOnScroll } from "../../../hooks";
import { Button } from "../../ui";
import { rubikClassName, syneClassName } from "../../utils/font";

const ClubCTA: React.FC = () => {
  const sectionRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <section
      className="min-h-[60vh] flex flex-col items-center justify-center snap-center text-center px-6 relative"
      ref={sectionRef}
    >
      <h2
        className={cn(
          "text-[32px] md:text-[64px] leading-[40px] md:leading-[72px] font-extrabold uppercase",
          syneClassName
        )}
      >
        Join the
        <br />
        <span className="text-zui-yellow">Club</span>
      </h2>

      <p
        className={cn(
          "mt-6 text-base text-white/40 font-medium",
          rubikClassName
        )}
      >
        Get your Founder Membership. Build from Zo House.
      </p>

      <div className="mt-12 flex items-center justify-center gap-4 flex-wrap">
        <div className="primary-button rounded-xl">
          <Link href="/dashboard">
            <Button
              showEffect={true}
              type="primary"
              className={cn(
                "bg-zui-yellow rounded-xl px-10 py-4 text-zui-dark font-semibold",
                rubikClassName
              )}
            >
              Sign In &rarr;
            </Button>
          </Link>
        </div>

        <Link
          href="https://play.google.com/store/apps/details?id=xyz.zo.club"
          target="_blank"
        >
          <Button
            showEffect={false}
            type="secondary"
            className={cn(
              "rounded-xl px-10 py-4 text-white/50 font-medium border-2 border-zui-stroke bg-black hover:border-zui-yellow hover:text-zui-yellow transition-all",
              rubikClassName
            )}
          >
            Download Zo Club
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default ClubCTA;
