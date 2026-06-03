import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NFCProduct } from "./types";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Maximize2,
  Move
} from "lucide-react";

interface ProductGalleryProps {
  product: NFCProduct;
  isOpen: boolean;
  onClose: () => void;
}

// Product angle images - simulated with gradient variations
const getProductAngles = (product: NFCProduct) => {
  const baseGradient = product.image;
  return [
    { id: 'front', label: 'Front View', angle: 0, gradient: baseGradient },
    { id: 'angle-left', label: 'Left Angle', angle: -30, gradient: baseGradient },
    { id: 'angle-right', label: 'Right Angle', angle: 30, gradient: baseGradient },
    { id: 'top', label: 'Top View', angle: 0, rotateX: 45, gradient: baseGradient },
    { id: 'back', label: 'Back View', angle: 180, gradient: baseGradient },
  ];
};

// Product shape renderers for different categories
const ProductShape = ({ 
  category, 
  gradient, 
  rotateY = 0, 
  rotateX = 0 
}: { 
  category: string; 
  gradient: string; 
  rotateY?: number;
  rotateX?: number;
}) => {
  const transform = `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
  
  switch (category) {
    case 'card':
      return (
        <div 
          className={`w-80 h-48 rounded-2xl bg-gradient-to-br ${gradient} shadow-2xl flex items-center justify-center relative overflow-hidden`}
          style={{ transform }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20" />
          <div className="absolute top-4 right-4 w-10 h-8 bg-yellow-400/80 rounded-md" />
          <div className="absolute bottom-4 left-4 text-white/80 text-sm font-medium">NFC Business Card</div>
          <div className="absolute bottom-4 right-4">
            <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.28 5.45a1.5 1.5 0 0 1 .82.44l.1.12a1.5 1.5 0 0 1 0 2l-.12.1a1.5 1.5 0 0 1-2 0l-.1-.12a1.5 1.5 0 0 1 .44-2.08l.12-.08a1.5 1.5 0 0 1 .74-.38z" />
              <path d="M12 2a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1z" />
              <path d="M17.66 6.34a1 1 0 0 1 0 1.41l-1.41 1.42a1 1 0 1 1-1.42-1.42l1.42-1.41a1 1 0 0 1 1.41 0z" />
            </svg>
          </div>
        </div>
      );
    case 'sticker':
      return (
        <div 
          className={`w-48 h-48 rounded-full bg-gradient-to-br ${gradient} shadow-2xl flex items-center justify-center relative`}
          style={{ transform }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-black/20" />
          <div className="text-white font-bold text-lg">TAP ME</div>
        </div>
      );
    case 'band':
      return (
        <div 
          className={`w-72 h-16 rounded-full bg-gradient-to-br ${gradient} shadow-2xl flex items-center justify-center px-8 relative overflow-hidden`}
          style={{ transform }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20" />
          <div className="text-white font-bold">YOUR NAME</div>
        </div>
      );
    case 'keychain':
      return (
        <div className="flex flex-col items-center" style={{ transform }}>
          <div className="w-10 h-10 rounded-full border-4 border-gray-400" />
          <div className="w-1 h-6 bg-gray-400" />
          <div className={`w-28 h-40 rounded-2xl bg-gradient-to-br ${gradient} shadow-2xl flex items-center justify-center relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20" />
            <div className="text-white font-bold text-sm text-center px-2">NFC<br/>Keychain</div>
          </div>
        </div>
      );
    case 'review':
      return (
        <div className="flex flex-col items-center" style={{ transform }}>
          <div className={`w-64 h-44 rounded-t-2xl bg-gradient-to-br ${gradient} shadow-2xl flex flex-col items-center justify-center relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20" />
            <div className="flex gap-1 mb-2">
              {[1,2,3,4,5].map((s) => (
                <span key={s} className="text-yellow-400 text-2xl">★</span>
              ))}
            </div>
            <div className="text-white font-bold">Leave a Review</div>
          </div>
          <div className={`w-64 h-10 rounded-b-lg bg-gradient-to-br ${gradient} shadow-lg`} style={{ filter: 'brightness(0.8)' }} />
        </div>
      );
    default:
      return null;
  }
};

export function ProductGallery({ product, isOpen, onClose }: ProductGalleryProps) {
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  const angles = getProductAngles(product);
  const currentAngle = angles[currentAngleIndex];

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handlePrevious = () => {
    setCurrentAngleIndex(prev => (prev === 0 ? angles.length - 1 : prev - 1));
    handleReset();
  };

  const handleNext = () => {
    setCurrentAngleIndex(prev => (prev === angles.length - 1 ? 0 : prev + 1));
    handleReset();
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }
  }, [isDragging, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(prev + 0.2, 3));
    } else {
      setZoom(prev => Math.max(prev - 0.2, 0.5));
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background/95 backdrop-blur-xl">
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="text-xl font-bold">{product.name}</h2>
              <p className="text-sm text-muted-foreground">{currentAngle.label}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium w-16 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 3}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Main Gallery View */}
          <div 
            ref={containerRef}
            className="relative h-[500px] bg-gradient-to-br from-muted/30 to-muted/60 overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* Zoom indicator */}
            {zoom > 1 && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
                <Move className="w-4 h-4" />
                <span>Drag to pan</span>
              </div>
            )}

            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handlePrevious}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handleNext}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>

            {/* Product Display */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentAngle.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  scale: zoom,
                  x: position.x,
                  y: position.y,
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center"
                style={{ transformOrigin: 'center center' }}
              >
                <ProductShape 
                  category={product.category}
                  gradient={currentAngle.gradient}
                  rotateY={currentAngle.angle}
                  rotateX={currentAngle.rotateX || 0}
                />
              </motion.div>
            </AnimatePresence>

            {/* Grid pattern background */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          {/* Thumbnail Strip */}
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="flex items-center justify-center gap-3">
              {angles.map((angle, index) => (
                <motion.button
                  key={angle.id}
                  onClick={() => {
                    setCurrentAngleIndex(index);
                    handleReset();
                  }}
                  className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    currentAngleIndex === index
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${angle.gradient}`}>
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ 
                        transform: `perspective(200px) rotateY(${angle.angle * 0.3}deg) rotateX(${(angle.rotateX || 0) * 0.3}deg)` 
                      }}
                    >
                      {product.category === 'card' && (
                        <div className="w-12 h-7 rounded bg-white/30" />
                      )}
                      {product.category === 'sticker' && (
                        <div className="w-8 h-8 rounded-full bg-white/30" />
                      )}
                      {product.category === 'band' && (
                        <div className="w-14 h-3 rounded-full bg-white/30" />
                      )}
                      {product.category === 'keychain' && (
                        <div className="w-6 h-8 rounded bg-white/30" />
                      )}
                      {product.category === 'review' && (
                        <div className="w-10 h-7 rounded bg-white/30" />
                      )}
                    </div>
                  </div>
                  <span className="absolute bottom-0.5 left-0 right-0 text-[8px] text-white/80 text-center font-medium truncate px-1">
                    {angle.label.split(' ')[0]}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">SAR {product.basePrice.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground ml-1">SAR</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
