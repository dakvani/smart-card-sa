-- 1. profile_blocks table
CREATE TABLE public.profile_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  click_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profile_blocks_user_pos_idx ON public.profile_blocks (user_id, position);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_blocks TO authenticated;
GRANT SELECT ON public.profile_blocks TO anon;
GRANT ALL ON public.profile_blocks TO service_role;

ALTER TABLE public.profile_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their blocks"
  ON public.profile_blocks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read visible blocks"
  ON public.profile_blocks
  FOR SELECT
  TO anon, authenticated
  USING (visible = true);

CREATE TRIGGER trg_profile_blocks_updated_at
  BEFORE UPDATE ON public.profile_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. profiles new columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wallpaper_style text,
  ADD COLUMN IF NOT EXISTS wallpaper_value text,
  ADD COLUMN IF NOT EXISTS qr_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 3. Backfill existing links into profile_blocks
INSERT INTO public.profile_blocks (user_id, kind, position, visible, data, click_count, created_at, updated_at)
SELECT
  l.user_id,
  'link'::text AS kind,
  COALESCE(l.position, 0) AS position,
  COALESCE(l.visible, true) AS visible,
  jsonb_build_object(
    'title', l.title,
    'url', l.url,
    'thumbnail_url', l.thumbnail_url,
    'scheduled_start', l.scheduled_start,
    'scheduled_end', l.scheduled_end,
    'is_featured', l.is_featured,
    'group_id', l.group_id,
    'legacy_link_id', l.id
  ),
  COALESCE(l.click_count, 0),
  COALESCE(l.created_at, now()),
  COALESCE(l.updated_at, now())
FROM public.links l
WHERE NOT EXISTS (
  SELECT 1 FROM public.profile_blocks pb
  WHERE pb.user_id = l.user_id
    AND pb.kind = 'link'
    AND (pb.data->>'legacy_link_id')::uuid = l.id
);

-- 4. Mark existing profiles that already have content as onboarded
UPDATE public.profiles p
   SET onboarded = true
 WHERE EXISTS (SELECT 1 FROM public.profile_blocks b WHERE b.user_id = p.user_id);
