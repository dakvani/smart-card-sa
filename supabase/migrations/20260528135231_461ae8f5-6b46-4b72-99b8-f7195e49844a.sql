
-- 1. Products catalog table
CREATE TABLE public.nfc_catalog_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'card',
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  photo_url TEXT,
  gradient TEXT NOT NULL DEFAULT 'from-violet-500 to-purple-600',
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.nfc_catalog_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nfc_catalog_products TO authenticated;
GRANT ALL ON public.nfc_catalog_products TO service_role;

ALTER TABLE public.nfc_catalog_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active products are viewable by everyone"
  ON public.nfc_catalog_products FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert products"
  ON public.nfc_catalog_products FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update products"
  ON public.nfc_catalog_products FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete products"
  ON public.nfc_catalog_products FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_nfc_catalog_products_updated_at
BEFORE UPDATE ON public.nfc_catalog_products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Storage bucket for product photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Product photos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-photos');

CREATE POLICY "Admins can upload product photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update product photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-photos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete product photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-photos' AND has_role(auth.uid(), 'admin'::app_role));

-- 3. Seed the 6 SmartCard products
INSERT INTO public.nfc_catalog_products (slug, name, description, category, base_price, gradient, stock_quantity, position) VALUES
('smartcard-nfc-card', 'Standard SmartCard NFC Card', 'Premium PVC SmartCard with embedded NTAG215 chip. Upload your custom logo and share your profile with a single tap.', 'card', 24.99, 'from-violet-500 to-purple-600', 100, 1),
('smartcard-phone-sticker', 'SmartCard NFC Phone Sticker', 'Epoxy resin finish phone sticker with custom logo upload. Stick to the back of any phone for instant tap-to-share networking.', 'sticker', 12.99, 'from-cyan-500 to-blue-600', 100, 2),
('smartcard-nfc-sticker', 'SmartCard NFC Sticker', 'Custom design waterproof NFC sticker with logo upload. Place it on laptops, notebooks, or anywhere you network.', 'sticker', 9.99, 'from-teal-500 to-cyan-600', 100, 3),
('smartcard-keychain', 'SmartCard Key Chain', 'Durable custom-designed NFC keychain with logo upload. Always carry your SmartCard digital profile with you.', 'keychain', 14.99, 'from-orange-500 to-amber-600', 100, 4),
('smartcard-social-tag', 'SmartCard Social Media Tag', 'Stylish custom-designed NFC tag with logo upload. Share your social media profiles instantly at events and meetups.', 'band', 16.99, 'from-green-500 to-emerald-600', 100, 5),
('smartcard-review-card', 'SmartCard Review Card', 'Custom-designed NFC review card with logo upload. Customers tap to leave a Google or Yelp review instantly.', 'review', 29.99, 'from-pink-500 to-rose-600', 100, 6);
