import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

export function MissionHouses() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["100vw", "-65vw"]);

  return (
    <div ref={containerRef} className="relative h-[200vh]">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center">
        <motion.div
          style={{ x }}
          className="flex items-center gap-6 pl-8 md:pl-16"
        >
          <div className="relative w-[60vw] h-[70vh] rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 group cursor-pointer">
            <Image
              src="/house/zo-blr.webp"
              alt="Whitefield House"
              fill
              sizes="60vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
              <span className="text-[10px] font-bold tracking-[0.3em] text-white/50 uppercase">Property 01</span>
              <h3 className="text-3xl md:text-5xl font-bold tracking-tight mt-2 mb-3">Whitefield</h3>
              <p className="text-white/60 text-base md:text-lg font-light leading-relaxed">
                3-storey villa. Pool. Studio. 20 beds.{" "}
                <span className="text-white font-serif italic">The compound.</span>
              </p>
            </div>
          </div>
          <div className="relative w-[60vw] h-[70vh] rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 group cursor-pointer">
            <Image
              src="/house/zo-krm.webp"
              alt="Koramangala House"
              fill
              sizes="60vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
              <span className="text-[10px] font-bold tracking-[0.3em] text-white/50 uppercase">Property 02</span>
              <h3 className="text-3xl md:text-5xl font-bold tracking-tight mt-2 mb-3">Koramangala</h3>
              <p className="text-white/60 text-base md:text-lg font-light leading-relaxed">
                13th-floor penthouse. City views. 14 beds.{" "}
                <span className="text-white font-serif italic">The stage.</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
