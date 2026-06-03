import { motion, useScroll, useTransform } from "framer-motion";
import { Link2, Palette, Share2 } from "lucide-react";
import { useRef } from "react";

const steps = [
  {
    icon: Link2,
    title: "Create",
    description: "Claim your unique URL in seconds. No credit card required.",
    color: "from-violet-500/60 to-purple-600/40",
  },
  {
    icon: Palette,
    title: "Customize",
    description: "Add your links, choose your theme, and make it uniquely yours.",
    color: "from-pink-500/60 to-rose-600/40",
  },
  {
    icon: Share2,
    title: "Share",
    description: "Paste your SmartCard URL in your bio and watch the clicks roll in.",
    color: "from-orange-500/60 to-amber-600/40",
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.3, 1, 1, 0.3]);

  return (
    <section ref={sectionRef} className="py-24 relative overflow-hidden">
      {/* Blurred background */}
      <motion.div 
        className="absolute inset-0 bg-secondary/20"
        style={{ y: backgroundY }}
      />
      
      
      <motion.div className="container mx-auto px-4 relative z-10" style={{ opacity }}>
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
              Up and running in <span className="gradient-text">3 simple steps</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg">
              No design skills needed. Create your SmartCard in minutes.
            </p>
            
            {/* Steps list */}
            <div className="space-y-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="flex items-start gap-4"
                >
                  {/* Step number */}
                  <div className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} backdrop-blur-xl flex items-center justify-center shadow-lg border border-border/20`}>
                      <step.icon className="w-7 h-7 text-foreground/90" />
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-0.5 h-8 bg-gradient-to-b from-border/50 to-transparent mt-2" />
                    )}
                  </div>
                  
                  <div className="pt-1">
                    <div className="inline-flex items-center justify-center w-6 h-6 rounded-full glass text-foreground/80 text-xs font-bold mb-2">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-bold text-foreground/90">{step.title}</h3>
                    <p className="text-muted-foreground mt-1">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right side - Visual element */}
          <motion.div
            initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative">
              {/* Stacked cards visual */}
              <div className="relative w-[280px] sm:w-[320px] h-[400px]">
                {/* Back card */}
                <motion.div
                  className="absolute top-8 left-8 w-full h-full rounded-3xl bg-gradient-to-br from-violet-500/30 to-purple-600/20 border border-border/20 backdrop-blur-sm"
                  animate={{ rotate: [0, 2, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Middle card */}
                <motion.div
                  className="absolute top-4 left-4 w-full h-full rounded-3xl bg-gradient-to-br from-pink-500/30 to-rose-600/20 border border-border/20 backdrop-blur-sm"
                  animate={{ rotate: [0, -1, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Front card */}
                <motion.div
                  className="relative w-full h-full rounded-3xl bg-card/80 border border-border/30 backdrop-blur-xl shadow-elevated p-6"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/60 to-accent/60 mb-4 shadow-glow" />
                    <h4 className="font-bold text-foreground">@yourname</h4>
                    <p className="text-sm text-muted-foreground mt-1">Creator & Entrepreneur</p>
                    
                    <div className="mt-6 space-y-3">
                      {["Portfolio", "Shop", "Contact"].map((item) => (
                        <div
                          key={item}
                          className="w-full py-3 rounded-xl glass text-foreground/80 text-sm font-medium"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Glow effect */}
              <div className="absolute -inset-8 bg-gradient-to-br from-primary/10 to-accent/10 blur-[60px] -z-10 rounded-full" />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
