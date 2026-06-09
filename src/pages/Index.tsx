import { lazy, Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollStoryFallback } from "@/components/home/ScrollStoryFallback";
import { ProductBenefits } from "@/components/home/ProductBenefits";
import { ProductDesigns } from "@/components/home/ProductDesigns";
import { CTA } from "@/components/home/CTA";
import { Testimonials } from "@/components/home/Testimonials";
import { SEO } from "@/components/SEO";

// Lazy so the motion code doesn't block first paint; the fallback mirrors
// the initial stage so there's no blank flash or layout shift on mount.
const ScrollStory = lazy(() =>
  import("@/components/home/ScrollStory").then((m) => ({ default: m.ScrollStory }))
);

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="SmartCard — NFC Business Cards & Digital Bio-Link Profiles"
        description="Programmable NFC cards paired with a hosted bio-link profile. One tap shares your links, contact, and portfolio — no app required."
        path="/"
      />
      <Navbar />
      <main id="main-content" className="flex-1">
        <Suspense fallback={<ScrollStoryFallback />}>
          <ScrollStory />
        </Suspense>
        <ProductBenefits />
        <ProductDesigns />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
