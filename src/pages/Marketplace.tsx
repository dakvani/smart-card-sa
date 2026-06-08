import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { ExternalLink, Music, Video, MessageCircle, Mail, Phone, ShoppingBag } from "lucide-react";
import { SEO } from "@/components/SEO";


const categories = [
  {
    name: "Video",
    apps: [
      { name: "YouTube", description: "Embed your latest videos", icon: Video, color: "bg-red-500" },
      { name: "TikTok", description: "Share your TikTok content", icon: Video, color: "bg-foreground" },
      { name: "Vimeo", description: "Professional video hosting", icon: Video, color: "bg-blue-500" },
    ],
  },
  {
    name: "Music",
    apps: [
      { name: "Spotify", description: "Share your latest tracks", icon: Music, color: "bg-green-500" },
      { name: "SoundCloud", description: "Audio player integration", icon: Music, color: "bg-orange-500" },
      { name: "Apple Music", description: "Link your music library", icon: Music, color: "bg-pink-500" },
    ],
  },
  {
    name: "Social",
    apps: [
      { name: "Instagram", description: "Connect your profile", icon: ExternalLink, color: "bg-gradient-to-br from-purple-500 to-pink-500" },
      { name: "Twitter/X", description: "Share your tweets", icon: MessageCircle, color: "bg-foreground" },
      { name: "Facebook", description: "Link your page", icon: ExternalLink, color: "bg-blue-600" },
    ],
  },
  {
    name: "Contact",
    apps: [
      { name: "Email", description: "Let fans reach out", icon: Mail, color: "bg-gray-500" },
      { name: "SMS", description: "Text message link", icon: Phone, color: "bg-green-600" },
      { name: "WhatsApp", description: "Direct chat link", icon: MessageCircle, color: "bg-green-500" },
    ],
  },
  {
    name: "Commerce",
    apps: [
      { name: "Shop", description: "Sell your products", icon: ShoppingBag, color: "bg-purple-500" },
      { name: "Tip Jar", description: "Accept donations", icon: ExternalLink, color: "bg-yellow-500" },
      { name: "Gumroad", description: "Sell digital products", icon: ShoppingBag, color: "bg-pink-500" },
    ],
  },
];

export default function Marketplace() {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="App Marketplace — Integrations for SmartLink Profiles"
        description="Browse integrations and embeds for your SmartLink profile — video, music, social, messaging, payments, and more."
        path="/marketplace"
      />
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
              Integrations <span className="gradient-text">marketplace</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Connect your favorite platforms and supercharge your SmartCard.
            </motion.p>
          </div>
        </section>

        {/* Categories */}
        <section className="pb-24">
          <div className="container mx-auto px-4">
            {categories.map((category, catIndex) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: catIndex * 0.1 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold mb-6">{category.name}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.apps.map((app, appIndex) => (
                    <motion.div
                      key={app.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: appIndex * 0.05 }}
                      className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/20 hover:shadow-card transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${app.color} flex items-center justify-center shrink-0`}>
                          <app.icon className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{app.name}</h3>
                          <p className="text-sm text-muted-foreground">{app.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
