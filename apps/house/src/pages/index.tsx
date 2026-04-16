import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { MetaTags } from "../components/common/MetaTags";
import { ApplyModal } from "../components/ApplyModal";
import {
  BlurFade,
  HyperText,
  TextReveal,
  ZoRadioPill,
  MobileWaitlistBar,
  HouseWrapper,
  ProgramAccordion,
  TrackRecordScroll,
} from "../components/helpers/house";
import { Village } from "../components/Village";
import { HOUSE_MEDIA } from "../config/house-media";
import { fetchResidents } from "../lib/residents";
import { useZoAuth } from "../hooks/useZoAuth";
import { useScrollMilestones } from "../hooks/useScrollMilestones";
import { track } from "../lib/analytics/track";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  // ISR-style: cache at edge for 5 minutes, match the sync cadence
  ctx.res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600"
  );
  try {
    const data = await fetchResidents();
    return { props: { residents: data } };
  } catch {
    return {
      props: {
        residents: { blr: [], wtf: [], syncedAt: null },
      },
    };
  }
};

function ScrollGlobe() {
  return (
    <div className="w-48 h-48 md:w-64 md:h-64 mx-auto mb-10 flex items-center justify-center rounded-full overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-[150%] h-[150%] object-cover"
        style={{ background: "black" }}
        src="https://cdn.zo.xyz/gallery/media/videos/3f49b592-4115-4117-8c80-c1a9e1d889a1_20240925123905.mp4"
      />
    </div>
  );
}

export default function House({
  residents,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const { isLoggedIn, showLoginModal } = useZoAuth();
  const [applyOpen, setApplyOpen] = useState(false);

  useScrollMilestones();

  const goToApply = () => {
    if (isLoggedIn) {
      setApplyOpen(true);
    } else {
      showLoginModal({ onSuccess: () => setApplyOpen(true) });
    }
  };

  const handleHeroApply = () => {
    track("cta_click", { placement: "hero", intent: "apply" });
    goToApply();
  };

  const handleInlineApply = () => {
    track("cta_click", { placement: "inline", intent: "apply" });
    goToApply();
  };

  // Deep link: ?apply=1 (from /apply redirect or the empty-plot tooltip).
  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.apply === "1") {
      goToApply();
      // Clean the URL without reloading.
      router.replace("/", undefined, { shallow: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.apply]);
  return (
    <HouseWrapper>
      <div
        className="relative bg-black text-white"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        <MetaTags />

        {/* TopNavBar */}
        <header className="fixed top-0 left-0 w-full z-50 px-8 md:px-28 py-6 bg-transparent flex justify-between items-center max-w-full">
          <span className="text-xl font-black tracking-tighter text-white font-[family-name:var(--font-headline)] italic shiny-gold">
            Zo House
          </span>
          <ZoRadioPill />
        </header>

        {/* Hero Section */}
        <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover opacity-60"
            >
              <source src={HOUSE_MEDIA.heroVideo} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>
          <BlurFade inView delay={0.2} direction="up">
            <div className="relative z-10 text-center px-6 max-w-5xl pt-16 md:pt-32">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
                <div className="flex -space-x-3">
                  <Image
                    className="w-8 h-8 rounded-full border border-black object-cover"
                    src={HOUSE_MEDIA.pfp1}
                    alt="User avatar"
                    width={32}
                    height={32}
                  />
                  <Image
                    className="w-8 h-8 rounded-full border border-black object-cover"
                    src={HOUSE_MEDIA.pfp2}
                    alt="User avatar"
                    width={32}
                    height={32}
                  />
                  <Image
                    className="w-8 h-8 rounded-full border border-black object-cover"
                    src={HOUSE_MEDIA.pfp3}
                    alt="User avatar"
                    width={32}
                    height={32}
                  />
                </div>
                <span className="bg-white text-black text-xs font-bold tracking-widest uppercase px-3 py-1">
                  India&apos;s first permanent hacker house
                </span>
              </div>
              <h1 className="text-5xl md:text-8xl font-medium tracking-tight mb-6 leading-[0.9]">
                The{" "}
                <span className="font-[family-name:var(--font-headline)] italic font-normal shiny-gold">
                  Civilisation
                </span>{" "}
                Is Recruiting
              </h1>
              <button
                onClick={handleHeroApply}
                className="hidden md:block bg-white text-black font-bold text-[11px] tracking-widest uppercase rounded-full px-10 py-3.5 hover:scale-[1.03] active:scale-95 transition-all duration-300 mx-auto"
              >
                Apply Now
              </button>
            </div>
          </BlurFade>
        </section>

        <ProgramAccordion />

        <section className="section-padding px-8 md:px-28">
          <div className="max-w-7xl mx-auto">
            <BlurFade inView delay={0.2} direction="up">
              <div className="border-t border-white/5 pt-12 text-center">
                <p className="font-[family-name:var(--font-headline)] italic text-2xl shiny-gold opacity-60">
                  &ldquo;The house doesn&apos;t reset. It compounds.&rdquo;
                </p>
              </div>
            </BlurFade>
          </div>
        </section>

        <Village
          blr={residents.blr}
          wtf={residents.wtf}
          syncedAt={residents.syncedAt}
          onClaim={() => {
            // village_slot_click already fired inside Village.tsx; do NOT also fire
            // cta_click here. Empty-slot intent is wholly owned by Village.
            goToApply();
          }}
        />

        <section className="relative bg-black">
          <TextReveal
            segments={[
              { text: "India's permanent" },
              { text: "founder house", className: "font-[family-name:var(--font-headline)] italic shiny-gold" },
              { text: ". Where" },
              { text: "builders", className: "font-[family-name:var(--font-headline)] italic shiny-gold" },
              { text: "live, collaborate, and compound. Two nodes. 35 slots. Real founders, real time." },
            ]}
            textClassName="text-3xl md:text-5xl font-medium leading-[1.3]"
            header={<ScrollGlobe />}
          />
        </section>

        <TrackRecordScroll />

        {/* CTA Section */}
        <section className="relative min-h-[716px] w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src={HOUSE_MEDIA.heroBg}
              alt="Background"
              fill
              className="object-cover opacity-50"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          </div>
          <div className="relative z-10 text-center px-6 max-w-3xl">
            <BlurFade inView delay={0.1} direction="up">
              <h2 className="text-5xl md:text-7xl font-medium tracking-tight mb-6">
                The{" "}
                <span className="font-[family-name:var(--font-headline)] italic font-normal shiny-gold">
                  Civilisation
                </span>{" "}
                Is Waiting
              </h2>
              <p className="text-neutral-400 text-lg font-light mb-10">
                Join the waitlist. Be part of what&apos;s next.
              </p>
            </BlurFade>
            <BlurFade inView delay={0.25} direction="up">
              <button
                onClick={handleInlineApply}
                className="bg-white text-black font-bold text-[11px] tracking-widest uppercase rounded-full px-10 py-3.5 hover:scale-[1.03] active:scale-95 transition-all duration-300 mx-auto block"
              >
                Apply Now
              </button>
            </BlurFade>
          </div>
        </section>

        <MobileWaitlistBar onApply={goToApply} />

        <ApplyModal open={applyOpen} onClose={() => setApplyOpen(false)} />

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
              <a className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase hover:text-white transition-opacity duration-300" href="https://zo.xyz">
                zo.xyz
              </a>
              <a className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase hover:text-white transition-opacity duration-300" href="https://zozozo.work">
                zozozo.work
              </a>
            </div>
          </div>
        </footer>
      </div>
    </HouseWrapper>
  );
}
