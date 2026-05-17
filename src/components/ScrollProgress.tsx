import { motion, useScroll, useSpring, useTransform } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  const glowOpacity = useTransform(scrollYProgress, [0, 0.05, 1], [0, 1, 1]);

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-accent-foreground to-primary origin-left z-[60] shadow-[0_0_12px_hsl(var(--primary)/0.7)]"
        style={{ scaleX, opacity: glowOpacity }}
      />
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-primary/40 to-transparent origin-left z-[59] blur-md"
        style={{ scaleX, opacity: glowOpacity }}
        aria-hidden="true"
      />
    </>
  );
}
