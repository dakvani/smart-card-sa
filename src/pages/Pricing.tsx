import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowLeft, Sparkles } from "lucide-react";


const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "Unlimited Links",
      "Basic Themes (5 colors)",
      "Tip Jar support",
      "Last 28 days of analytics",
      "Mobile responsive",
    ],
    cta: "Get started free",
    popular: false,
  },
  {
    name: "Starter",
    price: "$5",
    period: "/mo",
    description: "For growing creators",
    features: [
      "Everything in Free, plus:",
      "Custom Fonts & Backgrounds",
      "Spotlight/Highlight Links",
      "6 Months of analytics",
      "Priority support",
      "Custom button styles",
    ],
    cta: "Start free trial",
    popular: true,
  },
  {
    name: "Pro",
    price: "$15",
    period: "/mo",
    description: "For power users & brands",
    features: [
      "Everything in Starter, plus:",
      "Remove SmartCard branding",
      "Export Email List",
      "Google Analytics integration",
      "Facebook Pixel integration",
      "Custom CSS",
      "API access",
    ],
    cta: "Start free trial",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24">
        {/* Header */}
        <section className="py-16 text-center">
          <div className="container mx-auto px-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              Simple, transparent <span className="gradient-text">pricing</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Start free and scale as you grow. No hidden fees.
            </motion.p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-2xl p-8 ${
                    plan.popular
                      ? "gradient-primary text-primary-foreground shadow-glow"
                      : "bg-card border border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-background text-foreground text-sm font-semibold rounded-full">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className={`text-xl font-bold mb-2 ${plan.popular ? "" : ""}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className={plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}>
                        {plan.period}
                      </span>
                    )}
                  </div>

                  <Link to="/auth?signup=true">
                    <Button
                      variant={plan.popular ? "heroOutline" : "gradient"}
                      className={`w-full mb-8 ${plan.popular ? "border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" : ""}`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 mt-0.5 shrink-0 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
                        <span className={`text-sm ${plan.popular ? "text-primary-foreground/90" : ""}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently asked questions
            </h2>
            <div className="max-w-3xl mx-auto space-y-6">
              {[
                {
                  q: "Can I switch plans anytime?",
                  a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.",
                },
                {
                  q: "Is there a free trial?",
                  a: "Both Starter and Pro plans come with a 14-day free trial. No credit card required.",
                },
                {
                  q: "What payment methods do you accept?",
                  a: "We accept all major credit cards, PayPal, and Apple Pay.",
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Absolutely. Cancel anytime from your account settings. No questions asked.",
                },
              ].map((faq) => (
                <div key={faq.q} className="bg-card rounded-xl p-6 border border-border">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
