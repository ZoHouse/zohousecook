import { motion } from "framer-motion";

const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

export function FrequencyGate({ onTuneIn }: { onTuneIn: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[10000] flex items-center justify-center cursor-pointer select-none"
      style={{ backgroundColor: "#050505" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: EASE }}
      onClick={onTuneIn}
    >
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />
      <motion.span
        className="text-[10px] md:text-xs uppercase tracking-[0.3em] animate-pulse"
        style={{ color: "#666" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
      >
        Tap to tune in
      </motion.span>
    </motion.div>
  );
}
