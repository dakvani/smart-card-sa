import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Search, BookOpen, Video, HelpCircle } from "lucide-react";
import { useState } from "react";
import { SEO } from "@/components/SEO";


const articles = [
  {
    category: "Getting Started",
    items: [
      { title: "How to add SmartCard to your Instagram Bio", icon: BookOpen },
      { title: "Creating your first SmartCard", icon: BookOpen },
      { title: "Customizing your background", icon: BookOpen },
    ],
  },
  {
    category: "Optimization",
    items: [
      { title: "Tips for getting more clicks", icon: BookOpen },
      { title: "Best practices for link arrangement", icon: BookOpen },
      { title: "Using analytics to improve performance", icon: BookOpen },
    ],
  },
  {
    category: "Video Tutorials",
    items: [
      { title: "Complete SmartCard setup guide", icon: Video },
      { title: "Advanced customization techniques", icon: Video },
      { title: "Monetization walkthrough", icon: Video },
    ],
  },
];

const faqs = [
  { q: "How do I claim my username?", a: "Enter your desired username on the homepage and click 'Claim your SmartCard' to get started." },
  { q: "Can I change my username later?", a: "Yes, you can change your username from your account settings at any time." },
  { q: "Is SmartCard really free?", a: "Yes! Our free plan includes unlimited links and basic themes. Paid plans offer additional features." },
  { q: "How do I add my SmartCard to Instagram?", a: "Copy your SmartCard URL and paste it in the 'Website' field of your Instagram bio." },
];

export default function Learn() {
  const [searchQuery, setSearchQuery] = useState("");

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Learn — SmartCard Help Center & Tutorials"
        description="Guides, video tutorials, and answers to common SmartCard questions — setup, customization, analytics, and Instagram bio integration."
        path="/learn"
        jsonLd={faqJsonLd}
      />
      <Navbar />
      <main className="flex-1 pt-24">

        {/* Header */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              Help <span className="gradient-text">Center</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            >
              Everything you need to know about SmartCard.
            </motion.p>
            
            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-xl mx-auto relative"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="How do I..."
                className="w-full h-14 pl-12 pr-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </motion.div>
          </div>
        </section>

        {/* Articles */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {articles.map((section, sectionIndex) => (
                <motion.div
                  key={section.category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: sectionIndex * 0.1 }}
                >
                  <h2 className="text-xl font-bold mb-4">{section.category}</h2>
                  <div className="space-y-3">
                    {section.items.map((item) => (
                      <div
                        key={item.title}
                        className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/20 hover:shadow-card transition-all cursor-pointer"
                      >
                        <item.icon className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              <HelpCircle className="inline-block w-8 h-8 mr-2 text-primary" />
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 rounded-xl bg-card border border-border"
                >
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground text-sm">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
