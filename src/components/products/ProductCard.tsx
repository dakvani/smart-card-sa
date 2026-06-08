import { useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Box, Images } from "lucide-react";
import { NFCProduct } from "./types";
import { productAnimations } from "./ProductAnimations";
const Product3DViewer = lazy(() =>
  import("./Product3DViewer").then((m) => ({ default: m.Product3DViewer }))
);
import { ProductGallery } from "./ProductGallery";
import { ProductReviews } from "./ProductReviews";
import { ProductRatingBadge } from "./ProductRatingBadge";
import { WishlistButton } from "./WishlistButton";
import { formatSAR } from "@/lib/currency";

interface ProductCardProps {
  product: NFCProduct;
  isSelected: boolean;
  onSelect: () => void;
}

export function ProductCard({ product, isSelected, onSelect }: ProductCardProps) {
  const [is3DViewerOpen, setIs3DViewerOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const AnimationComponent = productAnimations[product.category];

  const handle3DViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIs3DViewerOpen(true);
  };

  const handleGalleryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGalleryOpen(true);
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.03, y: -8 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSelect}
        className={`relative cursor-pointer rounded-3xl border-2 transition-all duration-300 overflow-hidden group ${
          isSelected
            ? "border-primary shadow-2xl ring-4 ring-primary/30"
            : "border-border/50 hover:border-primary/50 hover:shadow-xl"
        }`}
        role="button"
        aria-pressed={isSelected}
        aria-label={`Select ${product.name} - ${formatSAR(product.basePrice)}`}
      >
        {/* Product Animation Area */}
        <div 
          className={`aspect-[4/3] bg-gradient-to-br ${product.image} relative overflow-hidden`}
        >
          {/* Animated Background Pattern */}
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%),
                                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
            }}
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Product Photo */}
          {product.photo && (
            <img
              src={product.photo}
              alt={product.name}
              loading="lazy"
              width={1024}
              height={768}
              className="absolute inset-0 w-full h-full object-cover z-[5] transition-transform duration-500 group-hover:scale-105"
            />
          )}

          {/* Product Animation overlay */}
          <div className="relative z-10 w-full h-full mix-blend-overlay opacity-40">
            <AnimationComponent />
          </div>
          
          {/* Action Buttons */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <WishlistButton productId={product.id} productName={product.name} />
            <motion.button
              onClick={handleGalleryClick}
              className="p-2.5 rounded-xl bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`View ${product.name} gallery`}
            >
              <Images className="w-5 h-5 text-primary" />
            </motion.button>
            <motion.button
              onClick={handle3DViewClick}
              className="p-2.5 rounded-xl bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`View ${product.name} in 3D`}
            >
              <Box className="w-5 h-5 text-primary" />
            </motion.button>
          </div>
          
          {/* Glow effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        </div>

        {/* Product Info */}
        <div className="p-5 bg-card">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-xl leading-tight">{product.name}</h3>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-2">
            {product.description}
          </p>
          
          {/* Rating Badge */}
          <div className="mb-4" onClick={(e) => e.stopPropagation()}>
            <ProductRatingBadge 
              productId={product.id} 
              onClick={() => setIsReviewsOpen(true)} 
            />
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div>
              <span className="text-2xl font-bold text-primary">
                {formatSAR(product.basePrice)}
              </span>
              <span className="text-xs text-muted-foreground ml-1">SAR</span>
            </div>
            
            <motion.div
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isSelected 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              }`}
              whileHover={{ scale: 1.05 }}
            >
              {isSelected ? "Selected" : "Select"}
            </motion.div>
          </div>
        </div>

        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"
        />
      </motion.div>

      {/* 3D Viewer Modal — lazy-loaded (heavy three.js/drei deps) */}
      {is3DViewerOpen && (
        <Suspense fallback={null}>
          <Product3DViewer
            product={product}
            isOpen={is3DViewerOpen}
            onClose={() => setIs3DViewerOpen(false)}
          />
        </Suspense>
      )}

      {/* Gallery Modal */}
      <ProductGallery
        product={product}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />

      {/* Reviews Modal */}
      <ProductReviews
        productId={product.id}
        productName={product.name}
        isOpen={isReviewsOpen}
        onClose={() => setIsReviewsOpen(false)}
      />
    </>
  );
}
