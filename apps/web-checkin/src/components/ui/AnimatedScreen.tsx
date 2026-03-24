import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedScreenProps {
  children: ReactNode;
  key?: string | number;
  className?: string;
}

const AnimatedScreen = ({
  children,
  key,
  className = "",
}: AnimatedScreenProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: 0.3,
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedScreen;
