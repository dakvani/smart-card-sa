import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { nfcProducts as fallbackProducts, NFCProduct } from "@/components/products/types";
import { productAnimations } from "@/components/products/ProductAnimations";
import { formatSAR } from "@/lib/currency";

export function ProductShowcase() {
  const [products, setProducts] = useState<NFCProduct[]>(fallbackProducts);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("nfc_catalog_products")
        .select("id,slug,name,description,base_price,gradient,photo_url,category,position,is_active")
        .eq("is_active", true)
        .order("position", { ascending: true });
      if (data && data.length > 0) {
        const bySlug = new Map(fallbackProducts.map((p) => [p.id, p]));
        setProducts(
          data.map((r) => ({
            id: r.slug,
            name: r.name,
            description: r.description,
            basePrice: Number(r.base_price),
            image: r.gradient,
            photo: r.photo_url || bySlug.get(r.slug)?.photo,
            category: (r.category as NFCProduct["category"]) || "card",
          }))
        );
      }
    })();
  }, []);

  return (
    <section id="products" className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/[0.06] blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium mb-4 text-foreground/80">
            <ShoppingBag className="w-3.5 h-3.5 text-primary" /> Shop the collection
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-balance">
            Pick your <span className="gradient-text">SmartCard</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Cards, stickers, keychains, tags — every product carries the same chip-grade NFC tech, in the form factor you love.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {products.map((product, index) => {
            const Animation = productAnimations[product.category];
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -8 }}
                className="group relative rounded-3xl overflow-hidden border border-border/40 bg-card/50 backdrop-blur-xl hover:border-primary/40 hover:shadow-glow transition-all"
              >
                <Link to="/nfc-products" className="block">
                  <div className={`aspect-[4/3] bg-gradient-to-br ${product.image} relative overflow-hidden`}>
                    {product.photo && (
                      <img
                        src={product.photo}
                        alt={product.name}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover z-[5] transition-transform duration-700 group-hover:scale-110"
                      />
                    )}
                    <div className="relative z-10 w-full h-full mix-blend-overlay opacity-40">
                      <Animation />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-bold text-lg leading-tight text-foreground/95">{product.name}</h3>
                      <span className="shrink-0 text-xl font-bold gradient-text">
                        {formatSAR(product.basePrice)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{product.description}</p>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-2.5 transition-all">
                      Customize & order <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mt-12"
        >
          <Button asChild size="lg" className="h-14 px-8 gradient-primary shadow-glow">
            <Link to="/nfc-products">
              See all products <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
