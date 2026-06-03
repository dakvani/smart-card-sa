
-- ===== profiles: public-safe view =====
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = off) AS
SELECT id, user_id, username, title, bio, avatar_url, theme_name, theme_gradient,
       gradient_direction, social_links, custom_bg_color, custom_accent_color,
       animation_type, animation_speed, animation_intensity, email_collection_enabled,
       created_at, updated_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Replace the unconditional public SELECT policy on profiles with owner-only
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- ===== nfc_catalog_products: public-safe view (excludes stock_quantity) =====
CREATE OR REPLACE VIEW public.nfc_catalog_products_public
WITH (security_invoker = off) AS
SELECT id, slug, name, description, base_price, category, gradient, photo_url,
       position, is_active, created_at, updated_at
FROM public.nfc_catalog_products
WHERE is_active = true;

GRANT SELECT ON public.nfc_catalog_products_public TO anon, authenticated;

-- Lock the catalog table down to admin-only direct reads
DROP POLICY IF EXISTS "Active products are viewable by everyone" ON public.nfc_catalog_products;

CREATE POLICY "Admins can view all products"
ON public.nfc_catalog_products FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
