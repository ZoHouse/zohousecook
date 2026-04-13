import { InferGetServerSidePropsType } from "next";
import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";
import Image from "next/image";
import React, { useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { MetaTags } from "../components/common";
import {
  BlurFade,
  HyperText,
  TextReveal,
  MissionHouses,
  ZoRadioPill,
  MobileWaitlistBar,
  HouseWrapper,
  ProgramAccordion,
  TrackRecordScroll,
} from "../components/helpers/house";
import { Village } from "../components/Village";

import { fetchMetaData as getServerSideProps } from "../components/utils";
export { getServerSideProps };

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
        src="https://proxy.cdn.zo.xyz/gallery/media/videos/3f49b592-4115-4117-8c80-c1a9e1d889a1_20240925123905.mp4"
      />
    </div>
  );
}

const House: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {
  const router = useRouter();
  return (
    <HouseWrapper>
      <div className="relative bg-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <MetaTags
          title={metaData?.title || "Civilisation — Where Founders Build, Ship, and Raise"}
          description={
            metaData?.description ||
            "India's first permanent hacker house. Two properties in Bangalore. Apply for the waitlist."
          }
          image={metaData?.image}
        />

        {/* TopNavBar */}
        <header className="fixed top-0 left-0 w-full z-50 px-8 md:px-28 py-6 bg-transparent flex justify-between items-center max-w-full">
          <span className="text-xl font-black tracking-tighter text-white font-[family-name:var(--font-headline)] italic shiny-gold">
            Civilisation
          </span>
          <nav className="hidden md:flex items-center gap-6">
            <a
              className="text-neutral-400 font-medium hover:text-white transition-colors duration-300 text-[13px] tracking-wide uppercase"
              href="#"
            >
              Home
            </a>
            <span className="text-neutral-700">&bull;</span>
            <a
              className="text-neutral-400 font-medium hover:text-white transition-colors duration-300 text-[13px] tracking-wide uppercase"
              href="#"
            >
              How It Works
            </a>
            <span className="text-neutral-700">&bull;</span>
            <a
              className="text-neutral-400 font-medium hover:text-white transition-colors duration-300 text-[13px] tracking-wide uppercase"
              href="#"
            >
              Philosophy
            </a>
            <span className="text-neutral-700">&bull;</span>
            <a
              className="text-neutral-400 font-medium hover:text-white transition-colors duration-300 text-[13px] tracking-wide uppercase"
              href="#"
            >
              Use Cases
            </a>
          </nav>
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
              <source src="/hero-new.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>
          <BlurFade inView delay={0.2} direction="up">
            <div className="relative z-10 text-center px-6 max-w-5xl pt-32">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
                <div className="flex -space-x-3">
                  <Image
                    className="w-8 h-8 rounded-full border border-black object-cover"
                    src="/house/pfp1.webp"
                    alt="User avatar"
                    width={32}
                    height={32}
                  />
                  <Image
                    className="w-8 h-8 rounded-full border border-black object-cover"
                    src="/house/pfp2.webp"
                    alt="User avatar"
                    width={32}
                    height={32}
                  />
                  <Image
                    className="w-8 h-8 rounded-full border border-black object-cover"
                    src="/house/pfp3.webp"
                    alt="User avatar"
                    width={32}
                    height={32}
                  />
                </div>
                <span className="bg-white text-black text-xs font-bold tracking-widest uppercase px-3 py-1">
                  You&apos;re the 4,857th visitor
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
                onClick={() => router.push("/house/apply")}
                className="hidden md:block bg-white text-black font-bold text-[11px] tracking-widest uppercase rounded-full px-10 py-3.5 hover:scale-[1.03] active:scale-95 transition-all duration-300 mx-auto"
              >
                Apply Now
              </button>
            </div>
          </BlurFade>
        </section>

        {/* Hacker House Section - sticky scroll with accordion */}
        <ProgramAccordion />

        <section className="section-padding px-8 md:px-28">
          <div className="max-w-7xl mx-auto">
            <BlurFade inView delay={0.2} direction="up">
              <div className="border-t border-white/5 pt-12 text-center md:text-right">
                <p className="font-[family-name:var(--font-headline)] italic text-2xl shiny-gold opacity-60">
                  &ldquo;The house doesn&apos;t reset — it compounds.&rdquo;
                </p>
              </div>
            </BlurFade>
          </div>
        </section>

        {/* The Village Section */}
        <Village />

        {/* Mission Text Reveal Section */}
        <section className="relative bg-black">
          <TextReveal
            segments={[
              { text: "India's permanent" },
              { text: "founder house", className: "font-[family-name:var(--font-headline)] italic shiny-gold" },
              { text: "— where" },
              { text: "builders", className: "font-[family-name:var(--font-headline)] italic shiny-gold" },
              { text: "live, collaborate, and compound. Two properties. 450+ events. 2,700+ founders. 12+ programs." },
            ]}
            textClassName="text-3xl md:text-5xl font-medium leading-[1.3]"
            header={<ScrollGlobe />}
          />
        </section>

        {/* Track Record - Scroll Section */}
        <TrackRecordScroll />

        {/* CTA Section */}
        <section className="relative min-h-[716px] w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src="/hero.svg"
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
                <HyperText
                  as="span"
                  className="font-medium tracking-tight"
                  startOnView
                  duration={800}
                >
                  {"The "}
                </HyperText>
                <HyperText
                  as="span"
                  className="font-[family-name:var(--font-headline)] italic font-normal tracking-tight shiny-gold"
                  startOnView
                  duration={800}
                  delay={300}
                >
                  Civilisation
                </HyperText>
                <HyperText
                  as="span"
                  className="font-medium tracking-tight"
                  startOnView
                  duration={800}
                  delay={500}
                >
                  {" Is Waiting"}
                </HyperText>
              </h2>
              <p className="text-neutral-400 text-lg font-light mb-10">
                Join the waitlist. Be part of what&apos;s next.
              </p>
            </BlurFade>
            <BlurFade inView delay={0.25} direction="up">
              <button
                onClick={() => router.push("/house/apply")}
                className="bg-white text-black font-bold text-[11px] tracking-widest uppercase rounded-full px-10 py-3.5 hover:scale-[1.03] active:scale-95 transition-all duration-300 mx-auto block"
              >
                Apply Now
              </button>
            </BlurFade>
          </div>
        </section>

        <MobileWaitlistBar />

        {/* Footer */}
        <footer className="bg-black py-20 pb-28 md:pb-20 px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center w-full border-t border-white/5 pt-12">
            <div className="mb-8 md:mb-0 text-center md:text-left">
              <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                <span className="text-lg font-black text-white font-[family-name:var(--font-headline)] italic shiny-gold">Civilisation</span>
              </div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-500">
                &copy; 2025 The Civilisation. All rights reserved.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-8 md:gap-12">
              <a
                className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase hover:text-white transition-opacity duration-300"
                href="#"
              >
                Privacy Policy
              </a>
              <a
                className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase hover:text-white transition-opacity duration-300"
                href="#"
              >
                Terms of Service
              </a>
              <a
                className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase hover:text-white transition-opacity duration-300"
                href="#"
              >
                Archive
              </a>
              <a
                className="text-neutral-500 text-[10px] font-bold tracking-widest uppercase hover:text-white transition-opacity duration-300"
                href="#"
              >
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>
    </HouseWrapper>
  );
};

export default House;
