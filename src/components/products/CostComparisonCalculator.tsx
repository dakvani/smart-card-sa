import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Leaf, TrendingDown, RefreshCw } from "lucide-react";

const PAPER_COST_PER_CARD = 0.35; // average printed business card cost
const REPRINTS_PER_YEAR = 4; // box of 250 reprinted ~4x/year for active networkers
const SMARTCARD_PRICE = 24.99; // Standard SmartCard NFC Card

export function CostComparisonCalculator() {
  const [cardsPerYear, setCardsPerYear] = useState(500);
  const [years, setYears] = useState(3);

  const { paperTotal, smartcardTotal, savings, treesSaved } = useMemo(() => {
    const paperTotal = cardsPerYear * PAPER_COST_PER_CARD * years * (REPRINTS_PER_YEAR / 4);
    const smartcardTotal = SMARTCARD_PRICE;
    const savings = Math.max(0, paperTotal - smartcardTotal);
    const treesSaved = (cardsPerYear * years) / 8333; // ~8,333 cards per tree
    return { paperTotal, smartcardTotal, savings, treesSaved };
  }, [cardsPerYear, years]);

  return (
    <section className="my-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-card/60 backdrop-blur-xl border border-border rounded-3xl p-8 md:p-12 shadow-elevated"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm font-semibold">Cost Comparison</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Paper cards vs <span className="gradient-text">SmartCard</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See how much you'll save by switching from recurring paper card prints
            to a one-time SmartCard purchase.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 mb-10">
          <div>
            <label className="flex justify-between text-sm font-medium mb-3">
              <span>Cards handed out per year</span>
              <span className="text-primary">{cardsPerYear}</span>
            </label>
            <Slider
              value={[cardsPerYear]}
              min={50}
              max={2000}
              step={50}
              onValueChange={(v) => setCardsPerYear(v[0])}
            />
          </div>
          <div>
            <label className="flex justify-between text-sm font-medium mb-3">
              <span>Years</span>
              <span className="text-primary">{years}</span>
            </label>
            <Slider
              value={[years]}
              min={1}
              max={10}
              step={1}
              onValueChange={(v) => setYears(v[0])}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-background/40 p-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
              <RefreshCw className="w-4 h-4" />
              Paper cards
            </div>
            <div className="text-3xl font-bold">${paperTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Recurring print &amp; reorder cost
            </p>
          </div>

          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-6">
            <div className="flex items-center gap-2 text-primary text-sm mb-2">
              <TrendingDown className="w-4 h-4" />
              SmartCard
            </div>
            <div className="text-3xl font-bold">${smartcardTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              One-time purchase, edit anytime
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-background/40 p-6">
            <div className="flex items-center gap-2 text-emerald-500 text-sm mb-2">
              <Leaf className="w-4 h-4" />
              Your savings
            </div>
            <div className="text-3xl font-bold text-emerald-500">
              ${savings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {treesSaved.toFixed(2)} trees saved 🌱
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
