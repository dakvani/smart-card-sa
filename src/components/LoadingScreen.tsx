import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { SmartCardLogo } from "@/components/brand/SmartCardLogo";

interface LoadingScreenProps {
  onComplete?: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Accelerate towards the end
        const increment = prev < 70 ? 15 : prev < 90 ? 8 : 3;
        return Math.min(prev + increment, 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: progress >= 100 ? 0 : 1 }}
      transition={{ duration: 0.5, delay: progress >= 100 ? 0.3 : 0 }}
      onAnimationComplete={() => {
        if (progress >= 100) {
          onComplete?.();
        }
      }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
    >
      {/* Animated Icon */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative"
      >
        {/* Glow effect */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl"
        />
        
        {/* Icon */}
        <motion.div
          className="w-24 h-24 rounded-2xl relative z-10 flex items-center justify-center bg-background/60 backdrop-blur border border-border text-primary"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <SmartCardLogo className="w-14 h-14" />
        </motion.div>
        
        {/* Pulse rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-2xl border-2 border-primary/30"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeOut",
            }}
          />
        ))}
      </motion.div>

      {/* Brand text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-8 text-center"
      >
        <h1 className="text-2xl font-bold text-foreground">SmartCard</h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-muted-foreground mt-2"
        >
          Everything you are. In one simple link.
        </motion.p>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: 1, width: "200px" }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="mt-8 h-1.5 bg-muted rounded-full overflow-hidden"
      >
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-pink-500 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </motion.div>

      {/* Progress percentage */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-xs text-muted-foreground mt-3"
      >
        {progress}%
      </motion.p>
    </motion.div>
  );
}

// Check if this is the first visit
export function shouldShowLoadingScreen(): boolean {
  const hasVisited = localStorage.getItem("smartcard_visited");
  if (!hasVisited) {
    localStorage.setItem("smartcard_visited", "true");
    return true;
  }
  return false;
}
