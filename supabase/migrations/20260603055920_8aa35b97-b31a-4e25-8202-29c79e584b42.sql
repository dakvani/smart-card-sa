
-- 1) Prevent non-admins from changing their own plan via a BEFORE UPDATE trigger
CREATE OR REPLACE FUNCTION public.prevent_plan_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change subscription plan';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_plan_self_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_plan_self_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_plan_self_escalation();

REVOKE EXECUTE ON FUNCTION public.prevent_plan_self_escalation() FROM PUBLIC, anon, authenticated;

-- 2) Hide sensitive profile columns from anonymous (public) visitors. Authenticated users keep full read.
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, user_id, username, title, bio, avatar_url, theme_name, theme_gradient,
  gradient_direction, social_links, custom_bg_color, custom_accent_color,
  animation_type, animation_speed, animation_intensity, created_at, updated_at
) ON public.profiles TO anon;

-- 3) Hide internal stock_quantity from anonymous visitors on the catalog
REVOKE SELECT ON public.nfc_catalog_products FROM anon;
GRANT SELECT (
  id, slug, name, description, category, base_price, gradient,
  photo_url, is_active, position, created_at, updated_at
) ON public.nfc_catalog_products TO anon;

-- 4) Lock down the internal signup trigger helper (only the auth trigger should run it)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
