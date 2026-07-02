import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Star, Users, Zap } from "lucide-react";
import { useRef } from "react";

const stats = [
  { icon: Users, value: "50K+", label: "Cards shipped" },
  { icon: Star, value: "4.9", label: "Customer rating" },
  { icon: Zap, value: "<1s", label: "Tap to connect" },
];

export function CTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);

  return (
    <section ref={sectionRef} className="py-14 sm:py-20 lg:py-24 relative overflow-hidden">
      {/* Background with parallax */}
      <motion.div 
        className="absolute inset-0 gradient-dark"
        style={{ y: backgroundY }}
      />
      
      {/* Blurred orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [-20, 20, -20], y: [-10, 10, -10] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[100px]"
        />
        <motion.div
          animate={{ x: [20, -20, 20], y: [10, -10, 10] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/15 blur-[120px]"
        />
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60" />
      
      <motion.div 
        className="container mx-auto px-4 relative z-10"
        style={{ scale }}
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
          {/* Left side - Text content */}
          <motion.div
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-left"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-foreground/95 text-balance">
              Order your SmartCard today. Tap into tomorrow.
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg">
              Free worldwide shipping on orders over $50. Ships in 48 hours. Lifetime profile included.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link to="/nfc-products">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="hero" size="xl" className="glass-heavy border-primary/30 hover:border-primary/50 shadow-glow">
                    Shop now
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link to="/pricing">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="heroOutline" size="xl" className="border-border/50 text-foreground/80 hover:bg-card/40 hover:text-foreground">
                    View pricing
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>

          {/* Right side - Stats cards */}
          <motion.div
            initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 w-full max-w-sm">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="p-6 rounded-2xl glass border border-border/30 hover:border-primary/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
