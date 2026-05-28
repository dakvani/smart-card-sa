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
  { id: 'minimal', name: 'Minimal', colors: { bg: '#ffffff', text: '#000000', accent: '#6366f1' } },
  { id: 'dark', name: 'Dark Mode', colors: { bg: '#1a1a2e', text: '#ffffff', accent: '#8b5cf6' } },
  { id: 'gradient', name: 'Gradient', colors: { bg: '#667eea', text: '#ffffff', accent: '#f093fb' } },
  { id: 'nature', name: 'Nature', colors: { bg: '#134e5e', text: '#ffffff', accent: '#71b280' } },
  { id: 'sunset', name: 'Sunset', colors: { bg: '#ff6b6b', text: '#ffffff', accent: '#feca57' } },
  { id: 'ocean', name: 'Ocean', colors: { bg: '#0077b6', text: '#ffffff', accent: '#00b4d8' } },
];
