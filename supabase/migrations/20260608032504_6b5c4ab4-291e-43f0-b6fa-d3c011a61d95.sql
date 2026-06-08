
-- Template tier (free / starter / pro)
ALTER TABLE public.profile_templates
  ADD COLUMN IF NOT EXISTS required_plan text NOT NULL DEFAULT 'free';

UPDATE public.profile_templates
  SET required_plan = CASE WHEN is_premium THEN 'pro' ELSE 'free' END
  WHERE required_plan IS NULL OR required_plan = 'free';

ALTER TABLE public.profile_templates
  DROP CONSTRAINT IF EXISTS profile_templates_required_plan_check;
ALTER TABLE public.profile_templates
  ADD CONSTRAINT profile_templates_required_plan_check
  CHECK (required_plan IN ('free','starter','pro'));

-- Persistent custom background + motion prefs on profile
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS custom_background_url text,
  ADD COLUMN IF NOT EXISTS custom_background_type text,
  ADD COLUMN IF NOT EXISTS motion_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_custom_background_type_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_custom_background_type_check
  CHECK (custom_background_type IS NULL OR custom_background_type IN ('image','video'));

-- Storage policies for template-backgrounds bucket (path: <user_id>/<file>)
DROP POLICY IF EXISTS "Public read template backgrounds" ON storage.objects;
CREATE POLICY "Public read template backgrounds"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'template-backgrounds');

DROP POLICY IF EXISTS "Users upload own template backgrounds" ON storage.objects;
CREATE POLICY "Users upload own template backgrounds"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'template-backgrounds'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users update own template backgrounds" ON storage.objects;
CREATE POLICY "Users update own template backgrounds"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'template-backgrounds'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users delete own template backgrounds" ON storage.objects;
CREATE POLICY "Users delete own template backgrounds"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'template-backgrounds'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
