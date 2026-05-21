import { motion } from "framer-motion";
import { useMemo } from "react";

/**
 * Animated circuit-root background.
 * Traces grow outward from the central chip like roots, indicating
 * data sharing radiating from the SmartCard.
 *
 * Pure SVG + framer-motion. Sits behind hero content as a decorative layer.
 */
export function CircuitRootBackground() {
  // Generate radial circuit traces. Each trace = stepped path from center outward.
  const traces = useMemo(() => {
    const items: { d: string; delay: number; endX: number; endY: number }[] = [];
    const branches = 18;
    const cx = 500;
    const cy = 500;

    for (let i = 0; i < branches; i++) {
      const angle = (i / branches) * Math.PI * 2;
      // Stepped trace (orthogonal-ish, like PCB routes)
      const seg1 = 70 + Math.random() * 30;
      const seg2 = 80 + Math.random() * 80;
      const seg3 = 100 + Math.random() * 120;

      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      // perpendicular for stepping
      const perpX = -dirY;
      const perpY = dirX;
      const step = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 50);

      const p1x = cx + dirX * seg1;
      const p1y = cy + dirY * seg1;
      const p2x = p1x + perpX * step;
      const p2y = p1y + perpY * step;
      const p3x = p2x + dirX * seg2;
      const p3y = p2y + dirY * seg2;
      const p4x = p3x + perpX * step * 0.6;
      const p4y = p3y + perpY * step * 0.6;
      const p5x = p4x + dirX * seg3;
      const p5y = p4y + dirY * seg3;

      const d = `M ${cx} ${cy} L ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y} L ${p4x} ${p4y} L ${p5x} ${p5y}`;
      items.push({ d, delay: (i % 6) * 0.4 + Math.random() * 0.6, endX: p5x, endY: p5y });
    }
    return items;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* radial glow behind chip */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vmin] h-[60vmin] rounded-full bg-primary/[0.08] blur-[100px]" />

      <svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full opacity-[0.55]"
      >
        <defs>
          <radialGradient id="traceGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.95" />
            <stop offset="60%" stopColor="hsl(var(--accent))" stopOpacity="0.55" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="chipGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* chip ambient glow */}
        <circle cx="500" cy="500" r="220" fill="url(#chipGlow)" />

        {/* growing traces */}
        {traces.map((t, i) => (
          <g key={i} filter="url(#softGlow)">
            <motion.path
              d={t.d}
              fill="none"
              stroke="url(#traceGrad)"
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
              transition={{
                duration: 7,
                times: [0, 0.35, 0.8, 1],
                repeat: Infinity,
                delay: t.delay,
                ease: "easeInOut",
              }}
            />
            {/* end node */}
            <motion.circle
              cx={t.endX}
              cy={t.endY}
              r={2.5}
              fill="hsl(var(--accent))"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0, 1, 0], scale: [0, 0, 1.4, 0] }}
              transition={{
                duration: 7,
                times: [0, 0.5, 0.65, 1],
                repeat: Infinity,
                delay: t.delay,
                ease: "easeOut",
              }}
            />
            {/* data pulse traveling along trace */}
            <motion.circle
              r={3}
              fill="hsl(var(--primary))"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: t.delay + 0.4,
                ease: "easeOut",
              }}
            >
              <animateMotion
                dur="2.2s"
                repeatCount="indefinite"
                begin={`${t.delay + 0.4}s`}
                path={t.d}
              />
            </motion.circle>
          </g>
        ))}

        {/* central chip */}
        <g transform="translate(500 500)">
          {/* chip pins */}
          {Array.from({ length: 16 }).map((_, i) => {
            const side = Math.floor(i / 4);
            const idx = i % 4;
            const offset = -22 + idx * 15;
            const pinLen = 10;
            const t =
              side === 0
                ? `M ${offset} -34 L ${offset} ${-34 - pinLen}`
                : side === 1
                ? `M 34 ${offset} L ${34 + pinLen} ${offset}`
                : side === 2
                ? `M ${offset} 34 L ${offset} ${34 + pinLen}`
                : `M -34 ${offset} L ${-34 - pinLen} ${offset}`;
            return (
              <path
                key={i}
                d={t}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeLinecap="round"
                opacity={0.85}
              />
            );
          })}

          {/* chip body */}
          <rect
            x={-34}
            y={-34}
            width={68}
            height={68}
            rx={6}
            fill="hsl(var(--background))"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
          />
          <rect
            x={-28}
            y={-28}
            width={56}
            height={56}
            rx={4}
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth={0.6}
            opacity={0.7}
          />

          {/* NFC waves */}
          {[0, 1, 2].map((i) => (
            <motion.path
              key={i}
              d={`M ${-6 + i * 4} -8 Q 0 0 ${-6 + i * 4} 8`}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={1.6}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.25,
                ease: "easeOut",
              }}
            />
          ))}
          <circle cx={-12} cy={0} r={1.6} fill="hsl(var(--primary))" />

          {/* pulsing chip ring */}
          <motion.circle
            r={50}
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth={1}
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.8, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
          />
        </g>
      </svg>
    </div>
  );
}
