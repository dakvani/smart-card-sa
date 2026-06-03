import { motion } from "framer-motion";
import { Cpu, Radio, Layers, ShieldCheck } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Cpu,
    title: "NTAG 215/216 chip embedded",
    description: "Each product hides a high-grade NFC chip with 504–888 bytes of writable memory and unlimited reads.",
  },
  {
    number: "02",
    icon: Radio,
    title: "Tap any modern phone",
    description: "13.56 MHz contactless protocol. iPhone (iOS 14+) and all Android phones read it natively — no app, no pairing.",
  },
  {
    number: "03",
    icon: Layers,
    title: "Opens your SmartCard profile",
    description: "Your dynamic profile loads instantly — links, contact, social, products, payments — fully editable in real time.",
  },
  {
    number: "04",
    icon: ShieldCheck,
    title: "Secure & rewriteable",
    description: "Password-protectable, lock-on-demand, and reprogrammable forever. One product, infinite campaigns.",
  },
];

export function ProductTechnology() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-accent/[0.08] blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium mb-4 text-foreground/80">
              <Cpu className="w-3.5 h-3.5 text-primary" /> The technology
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-balance">
              Serious hardware. <span className="gradient-text">Zero learning curve.</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Under every SmartCard is industrial-grade NFC engineering — the same chip class trusted by global brands for payments, access control, and authentication.
            </p>

            <div className="space-y-6">
              {steps.map((s, i) => (
                <motion.div
                  key={s.number}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 backdrop-blur-sm border border-border/30 flex items-center justify-center">
                      <s.icon className="w-6 h-6 text-foreground/90" />
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="text-xs font-mono text-primary mb-1">{s.number}</div>
                    <h3 className="text-lg font-bold text-foreground/95 mb-1">{s.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Visual: animated NFC ripple */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative flex items-center justify-center min-h-[500px]"
          >
            {/* Ripples */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-primary/30"
                style={{ width: 120, height: 120 }}
                animate={{
                  scale: [1, 3.5],
                  opacity: [0.6, 0],
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.7,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            ))}

            {/* Card */}
            <motion.div
              animate={{ y: [-8, 8, -8], rotate: [-2, 2, -2] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-72 h-44 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent shadow-elevated p-6 flex flex-col justify-between border border-border/30"
            >
              <div className="flex items-center justify-between">
                <div className="text-primary-foreground/90 font-bold text-lg">SmartCard</div>
                <Radio className="w-6 h-6 text-primary-foreground/80" />
              </div>
              <div>
                <div className="text-primary-foreground/70 text-xs mb-1">@yourname</div>
                <div className="text-primary-foreground font-mono text-sm">smartcard.online</div>
              </div>
              {/* NFC chip */}
              <div className="absolute top-1/2 right-6 -translate-y-1/2 w-8 h-8 rounded bg-yellow-200/80 border border-yellow-600/40 grid grid-cols-3 gap-px p-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-yellow-700/60 rounded-sm" />
                ))}
              </div>
            </motion.div>

            {/* Phone hint */}
            <motion.div
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-4 right-4 sm:right-12 w-16 h-28 rounded-xl bg-card/80 border border-border/40 backdrop-blur-xl shadow-lg"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
