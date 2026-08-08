import smartcardNfcCardPhoto from "@/assets/products/smartcard-nfc-card.jpg";
import smartcardPhoneStickerPhoto from "@/assets/products/smartcard-phone-sticker.jpg";
import smartcardNfcStickerPhoto from "@/assets/products/smartcard-nfc-sticker.jpg";
import smartcardKeychainPhoto from "@/assets/products/smartcard-keychain.jpg";
import smartcardSocialTagPhoto from "@/assets/products/smartcard-social-tag.jpg";
import smartcardReviewCardPhoto from "@/assets/products/smartcard-review-card.jpg";

export interface NFCProduct {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  image: string;
  photo?: string;
  category: 'card' | 'sticker' | 'band' | 'keychain' | 'review';
}


export interface SideCustomization {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  name: string;
  title: string;
  logoUrl: string | null;
  customArtworkUrl: string | null;
  pattern: 'none' | 'dots' | 'lines' | 'grid' | 'waves' | 'geometric';
  borderStyle: 'none' | 'solid' | 'dashed' | 'gradient' | 'glow';
  icon: string | null;
  showQRCode: boolean;
}

export interface DesignCustomization {
  front: SideCustomization;
  back: SideCustomization;
  activeSide: 'front' | 'back';
  canvaDesignUrl: string | null;
  templateId: string | null;
  linkedProfileId: string | null;
  linkedProfileUsername: string | null;
  // New workflow fields
  inputMethod: 'template' | 'upload';
  industry: string | null;
  isDoubleSided: boolean;
  printReadyFileUrl: string | null;
  designMetadata: {
    dpi: number;
    colorMode: string;
    dimensions: string;
    bleed: string;
  } | null;
}

export interface CartItem {
  product: NFCProduct;
  customization: DesignCustomization;
  quantity: number;
}

export const defaultSideCustomization: SideCustomization = {
  backgroundColor: '#1a1a2e',
  textColor: '#ffffff',
  accentColor: '#6366f1',
  name: '',
  title: '',
  logoUrl: null,
  customArtworkUrl: null,
  pattern: 'none',
  borderStyle: 'none',
  icon: null,
  showQRCode: false,
};

export const defaultCustomization: DesignCustomization = {
  front: { ...defaultSideCustomization },
  back: { ...defaultSideCustomization, backgroundColor: '#2d2d44' },
  activeSide: 'front',
  canvaDesignUrl: null,
  templateId: null,
  linkedProfileId: null,
  linkedProfileUsername: null,
  inputMethod: 'template',
  industry: null,
  isDoubleSided: false,
  printReadyFileUrl: null,
  designMetadata: null,
};

export const patternOptions = [
  { id: 'none', name: 'None' },
  { id: 'dots', name: 'Dots' },
  { id: 'lines', name: 'Lines' },
  { id: 'grid', name: 'Grid' },
  { id: 'waves', name: 'Waves' },
  { id: 'geometric', name: 'Geometric' },
];

export const borderOptions = [
  { id: 'none', name: 'None' },
  { id: 'solid', name: 'Solid' },
  { id: 'dashed', name: 'Dashed' },
  { id: 'gradient', name: 'Gradient' },
  { id: 'glow', name: 'Glow' },
];

export const iconOptions = [
  { id: null, name: 'None', icon: '✕' },
  { id: 'briefcase', name: 'Business', icon: '💼' },
  { id: 'code', name: 'Tech', icon: '💻' },
  { id: 'palette', name: 'Creative', icon: '🎨' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'camera', name: 'Photo', icon: '📷' },
  { id: 'heart', name: 'Health', icon: '❤️' },
  { id: 'globe', name: 'Travel', icon: '🌍' },
  { id: 'rocket', name: 'Startup', icon: '🚀' },
];

export const nfcProducts: NFCProduct[] = [
  {
    id: 'smartcard-nfc-card',
    name: 'Standard SmartCard NFC Card',
    description: 'Premium PVC SmartCard with embedded NTAG215 chip. Upload your custom logo and share your profile with a single tap.',
    basePrice: 24.99,
    image: 'from-violet-500 to-purple-600',
    category: 'card',
    photo: smartcardNfcCardPhoto,
  },
  {
    id: 'smartcard-phone-sticker',
    name: 'SmartCard NFC Phone Sticker',
    description: 'Epoxy resin finish phone sticker with custom logo upload. Stick to the back of any phone for instant tap-to-share networking.',
    basePrice: 12.99,
    image: 'from-cyan-500 to-blue-600',
    category: 'sticker',
    photo: smartcardPhoneStickerPhoto,
  },
  {
    id: 'smartcard-nfc-sticker',
    name: 'SmartCard NFC Sticker',
    description: 'Custom design waterproof NFC sticker with logo upload. Place it on laptops, notebooks, or anywhere you network.',
    basePrice: 9.99,
    image: 'from-teal-500 to-cyan-600',
    category: 'sticker',
    photo: smartcardNfcStickerPhoto,
  },
  {
    id: 'smartcard-keychain',
    name: 'SmartCard Key Chain',
    description: 'Durable custom-designed NFC keychain with logo upload. Always carry your SmartCard digital profile with you.',
    basePrice: 14.99,
    image: 'from-orange-500 to-amber-600',
    category: 'keychain',
    photo: smartcardKeychainPhoto,
  },
  {
    id: 'smartcard-social-tag',
    name: 'SmartCard Social Media Tag',
    description: 'Stylish custom-designed NFC tag with logo upload. Share your social media profiles instantly at events and meetups.',
    basePrice: 16.99,
    image: 'from-green-500 to-emerald-600',
    category: 'band',
    photo: smartcardSocialTagPhoto,
  },
  {
    id: 'smartcard-review-card',
    name: 'SmartCard Review Card',
    description: 'Custom-designed NFC review card with logo upload. Customers tap to leave a Google or Yelp review instantly.',
    basePrice: 29.99,
    image: 'from-pink-500 to-rose-600',
    category: 'review',
    photo: smartcardReviewCardPhoto,
  },
];

export const designTemplates = [
  { id: 'classic-white', name: 'Classic White', colors: { bg: '#ffffff', text: '#111827', accent: '#6366f1' }, image: 'https://images.unsplash.com/photo-1589330273594-fade1ee91647?auto=format&fit=crop&q=80&w=300' },
  { id: 'midnight-gold', name: 'Midnight Gold', colors: { bg: '#020617', text: '#f8fafc', accent: '#eab308' }, image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=300' },
  { id: 'modern-slate', name: 'Modern Slate', colors: { bg: '#1e293b', text: '#f1f5f9', accent: '#38bdf8' }, image: 'https://images.unsplash.com/photo-1614850523296-e8c041de4398?auto=format&fit=crop&q=80&w=300' },
  { id: 'emerald-eco', name: 'Emerald Eco', colors: { bg: '#064e3b', text: '#ecfdf5', accent: '#34d399' }, image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300' },
  { id: 'royal-velvet', name: 'Royal Velvet', colors: { bg: '#4c1d95', text: '#f5f3ff', accent: '#a78bfa' }, image: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=300' },
  { id: 'terracotta', name: 'Terracotta', colors: { bg: '#7c2d12', text: '#fff7ed', accent: '#fb923c' }, image: 'https://images.unsplash.com/photo-1604147706323-d039d47dd3d0?auto=format&fit=crop&q=80&w=300' },
  { id: 'deep-ocean', name: 'Deep Ocean', colors: { bg: '#0c4a6e', text: '#f0f9ff', accent: '#0ea5e9' }, image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=300' },
  { id: 'industrial', name: 'Industrial', colors: { bg: '#27272a', text: '#fafafa', accent: '#71717a' }, image: 'https://images.unsplash.com/photo-1533035353720-f1c6a75cd8ab?auto=format&fit=crop&q=80&w=300' },
  { id: 'minimalist-soft', name: 'Soft Gray', colors: { bg: '#f8fafc', text: '#334155', accent: '#94a3b8' }, image: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?auto=format&fit=crop&q=80&w=300' },
  { id: 'vibrant-rose', name: 'Vibrant Rose', colors: { bg: '#831843', text: '#fdf2f8', accent: '#f472b6' }, image: 'https://images.unsplash.com/photo-1554188248-986adbb73be4?auto=format&fit=crop&q=80&w=300' },
];
