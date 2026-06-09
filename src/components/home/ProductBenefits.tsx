import { motion } from "framer-motion";
import { Zap, Recycle, Globe, BarChart3, Smartphone, Infinity as InfinityIcon } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Instant tap-to-share",
    description: "Your card, sticker, or keychain shares everything in under a second — no app, no friction.",
  },
  {
    icon: Recycle,
    title: "Update anytime, free",
    description: "Change your profile, links, or offers whenever you want. Your physical product never expires.",
  },
  {
    icon: Globe,
    title: "Works on any phone",
    description: "Compatible with all modern iPhone & Android devices. NFC is universal — your network is too.",
  },
  {
    icon: BarChart3,
    title: "Track every tap",
    description: "See exactly how many people scan your card and what they click. Real ROI on every handshake.",
  },
  {
    icon: Smartphone,
    title: "QR backup built in",
    description: "Each product also includes a unique QR code, so even non-NFC devices can connect instantly.",
  },
  {
    icon: InfinityIcon,
    title: "Built to last forever",
    description: "Premium PVC, metal, and silicone builds. The NFC chip outlasts the paper card it replaces.",
  },
];

export function ProductBenefits() {
  return (
    <section id="story-next" className="py-24 relative overflow-hidden bg-secondary/10">
      

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-balance">
            Why thousands switched to <span className="gradient-text">SmartCard</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            More than a business card. Every SmartCard product is a tiny piece of hardware doing serious work for your brand.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ y: -5 }}
              className="p-6 rounded-2xl glass border border-border/30 hover:border-primary/30 hover:shadow-glow transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                <b.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground/95">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
