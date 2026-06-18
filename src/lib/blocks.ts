// Block kind registry for the new builder.
import {
  Link2, Type, AlignLeft, Minus, Image as ImageIcon, Video, Music,
  MessageCircle, Mail, Phone, Contact as ContactIcon, ShoppingBag, ExternalLink,
  Instagram, Twitter, Youtube, Facebook, Linkedin, Github, Globe,
} from "lucide-react";

export type BlockKind =
  | "link"
  | "header"
  | "text"
  | "divider"
  | "social_row"
  | "media_embed"
  | "image"
  | "contact_whatsapp"
  | "contact_email"
  | "contact_phone"
  | "vcard"
  | "product_card"
  | "shop_link";

export type BlockCategory = "social" | "contact" | "commerce" | "media" | "text";

export interface BlockDef {
  kind: BlockKind;
  label: string;
  description: string;
  category: BlockCategory;
  icon: typeof Link2;
  defaultData: Record<string, unknown>;
}

export interface ProfileBlock {
  id: string;
  user_id: string;
  kind: BlockKind;
  position: number;
  visible: boolean;
  data: Record<string, any>;
  click_count: number;
  created_at?: string;
  updated_at?: string;
}

export const BLOCK_DEFS: BlockDef[] = [
  // Text
  { kind: "link", label: "Link", description: "Any URL — title and link", category: "text", icon: Link2, defaultData: { title: "New Link", url: "" } },
  { kind: "header", label: "Header", description: "Section heading", category: "text", icon: Type, defaultData: { text: "Section heading" } },
  { kind: "text", label: "Paragraph", description: "Plain text block", category: "text", icon: AlignLeft, defaultData: { text: "" } },
  { kind: "divider", label: "Divider", description: "Visual separator", category: "text", icon: Minus, defaultData: {} },
  // Social
  { kind: "social_row", label: "Social row", description: "Row of social icons", category: "social", icon: Instagram, defaultData: { instagram: "", twitter: "", youtube: "", tiktok: "", facebook: "", linkedin: "", github: "", website: "" } },
  // Contact
  { kind: "contact_whatsapp", label: "WhatsApp", description: "Tap-to-chat", category: "contact", icon: MessageCircle, defaultData: { phone: "", message: "" } },
  { kind: "contact_email", label: "Email", description: "Tap-to-email", category: "contact", icon: Mail, defaultData: { email: "", subject: "" } },
  { kind: "contact_phone", label: "Phone", description: "Tap-to-call", category: "contact", icon: Phone, defaultData: { phone: "" } },
  { kind: "vcard", label: "Contact", description: "Save contact (.vcf)", category: "contact", icon: ContactIcon, defaultData: { name: "", phone: "", email: "", company: "" } },
  // Commerce
  { kind: "product_card", label: "NFC Product", description: "Showcase from your catalog", category: "commerce", icon: ShoppingBag, defaultData: { product_id: "", title: "" } },
  { kind: "shop_link", label: "Shop link", description: "External shop URL", category: "commerce", icon: ExternalLink, defaultData: { title: "Shop", url: "" } },
  // Media
  { kind: "media_embed", label: "Embed", description: "YouTube / Spotify URL", category: "media", icon: Video, defaultData: { url: "", title: "" } },
  { kind: "image", label: "Image", description: "Upload an image", category: "media", icon: ImageIcon, defaultData: { url: "", caption: "" } },
];

export const CATEGORY_LABELS: Record<BlockCategory, string> = {
  social: "Social",
  contact: "Contact",
  commerce: "Commerce",
  media: "Media",
  text: "Text",
};

export const SOCIAL_ICONS = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  tiktok: Globe,
  facebook: Facebook,
  linkedin: Linkedin,
  github: Github,
  website: Globe,
};

export function getDef(kind: BlockKind): BlockDef | undefined {
  return BLOCK_DEFS.find((d) => d.kind === kind);
}
