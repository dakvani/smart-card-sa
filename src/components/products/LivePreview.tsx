import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DesignCustomization, NFCProduct, SideCustomization } from "./types";
import { Wifi, CreditCard, Sticker, Watch, Key, Star, RotateCw, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";

const iconMap = {
  card: CreditCard,
  sticker: Sticker,
  band: Watch,
  keychain: Key,
  review: Star,
};

interface LivePreviewProps {
  product: NFCProduct;
  customization: DesignCustomization;
}

// Pattern SVG backgrounds
const getPatternStyle = (pattern: string, accentColor: string) => {
  const patterns: Record<string, string> = {
    dots: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='${encodeURIComponent(accentColor)}' fill-opacity='0.2'/%3E%3C/svg%3E")`,
    lines: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0' stroke='${encodeURIComponent(accentColor)}' stroke-opacity='0.1' fill='none'/%3E%3C/svg%3E")`,
    grid: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='${encodeURIComponent(accentColor)}' stroke-opacity='0.1'/%3E%3C/svg%3E")`,
    waves: `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10c25-10 50 10 75 0s25-10 50 0' stroke='${encodeURIComponent(accentColor)}' stroke-opacity='0.15' fill='none'/%3E%3C/svg%3E")`,
    geometric: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='30,0 60,30 30,60 0,30' fill='none' stroke='${encodeURIComponent(accentColor)}' stroke-opacity='0.1'/%3E%3C/svg%3E")`,
  };
  return patterns[pattern] || 'none';
};

const getBorderStyle = (borderStyle: string, accentColor: string) => {
  switch (borderStyle) {
    case 'solid':
      return { border: `3px solid ${accentColor}` };
    case 'dashed':
      return { border: `3px dashed ${accentColor}` };
    case 'gradient':
      return { 
        border: '3px solid transparent',
        backgroundClip: 'padding-box',
        boxShadow: `0 0 0 3px ${accentColor}`,
      };
    case 'glow':
      return { 
        border: `2px solid ${accentColor}`,
        boxShadow: `0 0 20px ${accentColor}60, 0 0 40px ${accentColor}30`,
      };
    default:
      return {};
  }
};

const getIconEmoji = (iconId: string | null) => {
  const icons: Record<string, string> = {
    briefcase: '💼',
    code: '💻',
    palette: '🎨',
    music: '🎵',
    camera: '📷',
    heart: '❤️',
    globe: '🌍',
    rocket: '🚀',
  };
  return iconId ? icons[iconId] : null;
};

export function LivePreview({ product, customization }: LivePreviewProps) {
  const [showBack, setShowBack] = useState(false);
  const supportsTwoSides = product.category === 'card' || product.category === 'keychain';
  
  const currentSide = showBack ? customization.back : customization.front;

  const renderBusinessCard = (side: SideCustomization, isBack: boolean) => (
    <motion.div
      className="relative w-[340px] h-[200px] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
      style={{ 
        backgroundColor: side.backgroundColor,
        backgroundImage: getPatternStyle(side.pattern, side.accentColor),
        ...getBorderStyle(side.borderStyle, side.accentColor),
      }}
      initial={false}
      animate={{ rotateY: isBack ? 180 : 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Custom artwork background */}
      {side.customArtworkUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${side.customArtworkUrl})` }}
        />
      )}
      
      {/* Top Bar Decoration */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      {/* NFC icon */}
      <div className="absolute top-6 right-6 flex flex-col items-center gap-1 opacity-80">
        <Wifi className="w-5 h-5" style={{ color: side.accentColor }} />
        <span className="text-[6px] font-bold uppercase tracking-widest" style={{ color: side.textColor }}>Tap to Connect</span>
      </div>
      
      {/* Logo Container */}
      <div className="absolute top-8 left-8">
        {side.logoUrl ? (
          <div className="relative group">
            <div className="absolute -inset-1 bg-white/10 blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <img
              src={side.logoUrl}
              alt="Logo"
              className="relative w-14 h-14 rounded-xl object-contain shadow-lg"
            />
          </div>
        ) : (
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md bg-white/5 border border-white/10"
            style={{ color: side.accentColor }}
          >
            {getIconEmoji(side.icon) ? (
              <span className="text-2xl">{getIconEmoji(side.icon)}</span>
            ) : (
              <CreditCard className="w-6 h-6" />
            )}
          </div>
        )}
      </div>
      
      {/* QR Code Section */}
      {side.showQRCode && (
        <div className="absolute bottom-6 right-6 p-2 bg-white rounded-[14px] shadow-xl group hover:scale-105 transition-transform">
          <QRCodeSVG
            value={customization.linkedProfileUsername ? `https://smartcard.link/@${customization.linkedProfileUsername}` : "https://smartcard.link"}
            size={42}
            level="H"
          />
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="absolute bottom-8 left-8 right-20 space-y-1">
        <motion.h3
          layoutId={`name-${isBack}`}
          className="text-2xl font-black tracking-tight leading-none"
          style={{ 
            color: side.textColor,
            fontFamily: "'Inter', sans-serif"
          }}
        >
          {side.name || "YOUR NAME"}
        </motion.h3>
        <motion.p
          layoutId={`title-${isBack}`}
          className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70"
          style={{ color: side.textColor }}
        >
          {side.title || "PROFESSIONAL TITLE"}
        </motion.p>
        
        {!isBack && customization.linkedProfileUsername && (
          <div className="flex items-center gap-1.5 pt-2">
            <div className="w-4 h-4 rounded-full flex items-center justify-center bg-white/10 border border-white/5">
              <Star className="w-2.5 h-2.5" style={{ color: side.accentColor }} />
            </div>
            <span
              className="text-[9px] font-bold tracking-widest uppercase"
              style={{ color: side.accentColor }}
            >
              smartcard.link/@{customization.linkedProfileUsername}
            </span>
          </div>
        )}
      </div>
      
      {/* Side Decorative Accent */}
      <div
        className="absolute bottom-0 right-0 w-32 h-1 bg-gradient-to-l from-transparent to-transparent opacity-50"
        style={{ backgroundImage: `linear-gradient(to right, transparent, ${side.accentColor})` }}
      />
    </motion.div>
  );

  const renderSticker = () => {
    const side = customization.front;
    return (
      <div
        className="relative w-[200px] h-[200px] rounded-full shadow-2xl flex items-center justify-center"
        style={{ 
          backgroundColor: side.backgroundColor,
          backgroundImage: getPatternStyle(side.pattern, side.accentColor),
          ...getBorderStyle(side.borderStyle, side.accentColor),
        }}
      >
        {side.logoUrl ? (
          <img
            src={side.logoUrl}
            alt="Logo"
            className="w-24 h-24 rounded-full object-cover"
          />
        ) : (
          <div className="text-center">
            {getIconEmoji(side.icon) && (
              <span className="text-3xl mb-2 block">{getIconEmoji(side.icon)}</span>
            )}
            <Wifi className="w-12 h-12 mx-auto" style={{ color: side.accentColor }} />
            <p
              className="text-sm font-bold mt-2"
              style={{ color: side.textColor }}
            >
              {side.name || "TAP ME"}
            </p>
          </div>
        )}
        {!side.borderStyle || side.borderStyle === 'none' ? (
          <div
            className="absolute inset-0 rounded-full border-4"
            style={{ borderColor: side.accentColor }}
          />
        ) : null}
      </div>
    );
  };

  const renderBand = () => {
    const side = customization.front;
    return (
      <div
        className="relative w-[300px] h-[60px] rounded-full shadow-2xl flex items-center justify-center px-6"
        style={{ 
          backgroundColor: side.backgroundColor,
          ...getBorderStyle(side.borderStyle, side.accentColor),
        }}
      >
        {getIconEmoji(side.icon) && (
          <span className="text-xl mr-3">{getIconEmoji(side.icon)}</span>
        )}
        <Wifi className="w-5 h-5 mr-3" style={{ color: side.accentColor }} />
        <span
          className="font-bold text-lg"
          style={{ color: side.textColor }}
        >
          {side.name || "YOUR NAME"}
        </span>
        {!side.borderStyle || side.borderStyle === 'none' ? (
          <div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: side.accentColor }}
          />
        ) : null}
      </div>
    );
  };

  const renderKeychain = (side: SideCustomization, isBack: boolean) => (
    <motion.div 
      className="flex flex-col items-center"
      initial={false}
      animate={{ rotateY: isBack ? 180 : 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Ring */}
      <div
        className="w-8 h-8 rounded-full border-4"
        style={{ borderColor: side.accentColor }}
      />
      {/* Chain */}
      <div
        className="w-1 h-4"
        style={{ backgroundColor: side.accentColor }}
      />
      {/* Tag - Both sides */}
      <div
        className="relative w-[120px] h-[160px] rounded-2xl shadow-2xl flex flex-col items-center justify-center p-4"
        style={{ 
          backgroundColor: side.backgroundColor,
          backgroundImage: getPatternStyle(side.pattern, side.accentColor),
          ...getBorderStyle(side.borderStyle, side.accentColor),
        }}
      >
        {getIconEmoji(side.icon) && (
          <span className="text-2xl mb-1">{getIconEmoji(side.icon)}</span>
        )}
        <Wifi className="w-8 h-8 mb-2" style={{ color: side.accentColor }} />
        {side.logoUrl ? (
          <img
            src={side.logoUrl}
            alt="Logo"
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <>
            <p
              className="text-sm font-bold text-center"
              style={{ color: side.textColor }}
            >
              {side.name || "NAME"}
            </p>
            <p
              className="text-xs text-center mt-1"
              style={{ color: `${side.textColor}99` }}
            >
              {side.title || "Title"}
            </p>
          </>
        )}
        {side.showQRCode && (
          <div className="absolute bottom-2 right-2 bg-white p-0.5 rounded">
            <QRCodeSVG
              value={customization.linkedProfileUsername ? `https://smartcard.link/@${customization.linkedProfileUsername}` : "https://smartcard.link"}
              size={24}
            />
          </div>
        )}
      </div>
    </motion.div>
  );

  // L-shaped standing review card
  const renderReviewCard = () => {
    const side = customization.front;
    return (
      <div className="relative flex items-end">
        {/* Table surface shadow */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[280px] h-4 bg-gradient-to-t from-black/20 to-transparent blur-md rounded-full" />
        
        {/* L-shaped card structure */}
        <div className="relative">
          {/* Vertical part (main display) */}
          <motion.div
            className="relative w-[240px] h-[180px] rounded-t-2xl shadow-2xl overflow-hidden flex flex-col items-center justify-center"
            style={{ 
              backgroundColor: side.backgroundColor,
              backgroundImage: getPatternStyle(side.pattern, side.accentColor),
              ...getBorderStyle(side.borderStyle, side.accentColor),
              transformOrigin: 'bottom center',
              transform: 'perspective(800px) rotateX(5deg)',
            }}
          >
            {/* Icon decoration */}
            {getIconEmoji(side.icon) && (
              <span className="text-3xl mb-2">{getIconEmoji(side.icon)}</span>
            )}
            
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.div
                  key={star}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: star * 0.1, type: "spring" }}
                >
                  <Star
                    className="w-7 h-7 fill-current"
                    style={{ color: side.accentColor }}
                  />
                </motion.div>
              ))}
            </div>
            <h3
              className="text-lg font-bold text-center px-4"
              style={{ color: side.textColor }}
            >
              {side.name || "Leave a Review"}
            </h3>
            <p
              className="text-sm mt-2"
              style={{ color: `${side.textColor}99` }}
            >
              Tap to rate us!
            </p>
            <Wifi
              className="absolute bottom-3 right-3 w-5 h-5"
              style={{ color: side.accentColor }}
            />
            
            {side.showQRCode && (
              <div className="absolute bottom-3 left-3 bg-white p-1 rounded">
                <QRCodeSVG
                  value={customization.linkedProfileUsername ? `https://smartcard.link/@${customization.linkedProfileUsername}` : "https://smartcard.link/review"}
                  size={32}
                />
              </div>
            )}
          </motion.div>
          
          {/* Base (horizontal part creating L-shape) */}
          <div
            className="w-[240px] h-[40px] rounded-b-lg shadow-lg"
            style={{ 
              backgroundColor: side.backgroundColor,
              filter: 'brightness(0.85)',
              ...getBorderStyle(side.borderStyle, side.accentColor),
              borderTop: 'none',
            }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg"
              style={{ backgroundColor: side.accentColor }}
            />
          </div>
          
          {/* Table reflection effect */}
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[220px] h-[30px] rounded-full opacity-20 blur-sm"
            style={{ backgroundColor: side.accentColor }}
          />
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    switch (product.category) {
      case 'card':
        return renderBusinessCard(currentSide, showBack);
      case 'sticker':
        return renderSticker();
      case 'band':
        return renderBand();
      case 'keychain':
        return renderKeychain(currentSide, showBack);
      case 'review':
        return renderReviewCard();
      default:
        return renderBusinessCard(currentSide, showBack);
    }
  };

  return (
    <div className="bg-gradient-to-br from-muted/50 to-muted rounded-2xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Live Preview</h3>
        {supportsTwoSides && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBack(!showBack)}
            className="gap-2"
          >
            <RotateCw className="w-4 h-4" />
            {showBack ? 'Show Front' : 'Show Back'}
          </Button>
        )}
      </div>
      
      {supportsTwoSides && (
        <div className="flex justify-center gap-2 mb-4">
          <span className={`text-xs font-medium ${!showBack ? 'text-primary' : 'text-muted-foreground'}`}>
            Front
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className={`text-xs font-medium ${showBack ? 'text-primary' : 'text-muted-foreground'}`}>
            Back
          </span>
        </div>
      )}
      
      <AnimatePresence mode="wait">
        <motion.div
          key={`${showBack}-${JSON.stringify(currentSide)}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center min-h-[280px]"
        >
          {renderPreview()}
        </motion.div>
      </AnimatePresence>
      
      {customization.canvaDesignUrl && (
        <p className="text-xs text-center text-muted-foreground mt-4">
          📎 Canva design will be applied to final product
        </p>
      )}
    </div>
  );
}
