
ALTER TABLE public.profile_templates
  ADD COLUMN IF NOT EXISTS apply_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_template_apply(template_uuid uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profile_templates
     SET apply_count = COALESCE(apply_count, 0) + 1
   WHERE id = template_uuid;
$$;

CREATE OR REPLACE FUNCTION public.increment_template_view(template_uuid uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profile_templates
     SET view_count = COALESCE(view_count, 0) + 1
   WHERE id = template_uuid;
$$;

GRANT EXECUTE ON FUNCTION public.increment_template_apply(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_template_view(uuid) TO anon, authenticated;
