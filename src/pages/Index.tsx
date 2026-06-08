import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollStory } from "@/components/home/ScrollStory";
import { ProductBenefits } from "@/components/home/ProductBenefits";
import { ProductDesigns } from "@/components/home/ProductDesigns";
import { CTA } from "@/components/home/CTA";
import { Testimonials } from "@/components/home/Testimonials";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main id="main-content" className="flex-1">
        <ScrollStory />
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
