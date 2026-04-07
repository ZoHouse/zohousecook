import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WORDS = ["Imagine", "Build", "Ship"];
const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const finished = useRef(false);

  useEffect(() => {
    if (displayProgress > 66) setWordIndex(2);
    else if (displayProgress > 33) setWordIndex(1);
  }, [displayProgress]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    finished.current = false;
    let imagesReady = false;
    let current = 0;
    const startTime = Date.now();
    const MIN_DURATION = 2000;

    const checkImages = () => {
      const images = Array.from(document.images);
      if (images.length === 0) return true;
      return images.every((img) => img.complete);
    };

    const tick = () => {
      if (finished.current) return;

      imagesReady = checkImages();
      const elapsed = Date.now() - startTime;

      if (imagesReady && elapsed >= MIN_DURATION) {
        current = 100;
        setDisplayProgress(100);
        finished.current = true;
        setTimeout(() => onCompleteRef.current(), 400);
        return;
      }

      if (elapsed > 10000) {
        current = 100;
        setDisplayProgress(100);
        finished.current = true;
        setTimeout(() => onCompleteRef.current(), 400);
        return;
      }

      const target = imagesReady ? 95 : Math.min(90, (elapsed / 80) ** 0.7 * 5);
      current += (target - current) * 0.08;
      setDisplayProgress(Math.round(current));

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);

    const images = Array.from(document.images);
    const handler = () => {
      imagesReady = checkImages();
    };
    for (const img of images) {
      img.addEventListener("load", handler);
      img.addEventListener("error", handler);
    }

    return () => {
      finished.current = true;
      for (const img of images) {
        img.removeEventListener("load", handler);
        img.removeEventListener("error", handler);
      }
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex"
      style={{ backgroundColor: "#0a0a0a" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <motion.div
        className="absolute top-8 left-8 md:top-12 md:left-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <span
          className="text-xs md:text-sm uppercase tracking-[0.3em] font-serif italic"
          style={{ color: "#888888" }}
        >
          Civilisation
        </span>
      </motion.div>

      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={wordIndex}
            className="text-4xl md:text-6xl lg:text-7xl font-serif italic tabular-nums"
            style={{ color: "rgba(245, 245, 245, 0.8)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {WORDS[wordIndex]}
          </motion.span>
        </AnimatePresence>
      </div>

      <motion.div
        className="absolute bottom-8 right-8 md:bottom-12 md:right-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <span
          className="text-6xl md:text-8xl lg:text-9xl font-serif tabular-nums"
          style={{ color: "#f5f5f5" }}
        >
          {displayProgress.toString().padStart(3, "0")}
        </span>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-[3px] w-full" style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}>
          <motion.div
            className="h-full origin-left"
            style={{
              background: "linear-gradient(90deg, #ffffff 0%, #aaaaaa 100%)",
              boxShadow: "0 0 8px rgba(255, 255, 255, 0.25)",
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: displayProgress / 100 }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
