-- 1. Revoke sensitive columns from anon
REVOKE SELECT (stock_quantity) ON public.nfc_catalog_products FROM anon;
REVOKE SELECT (plan, theme_preference) ON public.profiles FROM anon;

-- Re-grant the remaining columns explicitly to anon so public reads keep working.
GRANT SELECT (
  id, slug, name, description, category, base_price, photo_url, gradient,
  is_active, position, created_at, updated_at
) ON public.nfc_catalog_products TO anon;

GRANT SELECT (
  id, user_id, username, title, bio, avatar_url, theme_name, theme_gradient,
  gradient_direction, custom_bg_color, custom_accent_color, social_links,
  email_collection_enabled, animation_type, animation_speed, animation_intensity,
  created_at, updated_at
) ON public.profiles TO anon;

-- 2. Pin search_path on the email-queue helper functions
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;