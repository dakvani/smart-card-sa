import { motion } from "framer-motion";
import { ReactNode, useState, useEffect } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface PageTransitionProps {
  children: ReactNode;
}

// NOTE: Do NOT animate transform/filter here.
// Those properties create a containing block for `position: fixed`
// descendants (the Navbar), which makes the fixed header scroll
// away with the page content instead of sticking to the viewport.
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const reducedMotionVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const pageTransition = {
  type: "tween" as const,
  ease: "easeInOut" as const,
  duration: 0.3,
};

const reducedMotionTransition = {
  duration: 0.1,
};

function LoadingSkeleton({ reducedMotion }: { reducedMotion: boolean }) {
  if (reducedMotion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full" />
          <span className="text-muted-foreground text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <motion.div
          className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          aria-hidden="true"
        />
        {/* Skeleton content */}
        <div className="flex flex-col items-center gap-2">
          <motion.div
            className="h-3 w-24 bg-muted rounded-full"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            aria-hidden="true"
          />
          <motion.div
            className="h-2 w-16 bg-muted/50 rounded-full"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            aria-hidden="true"
          />
        </div>
        <span className="sr-only">Loading page content</span>
      </div>
    </div>
  );
}

export function PageTransition({ children }: PageTransitionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Brief loading state for smooth transition feel
    // Skip for reduced motion preference
    const delay = prefersReducedMotion ? 0 : 150;
    const timer = setTimeout(() => setIsLoading(false), delay);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  if (isLoading) {
    return <LoadingSkeleton reducedMotion={prefersReducedMotion} />;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={prefersReducedMotion ? reducedMotionVariants : pageVariants}
      transition={prefersReducedMotion ? reducedMotionTransition : pageTransition}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}
