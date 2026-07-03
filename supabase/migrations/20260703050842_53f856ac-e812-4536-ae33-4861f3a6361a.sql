ALTER TABLE public.nfc_orders ALTER COLUMN user_id DROP NOT NULL;

CREATE POLICY "Guests can create orders"
ON public.nfc_orders
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

GRANT INSERT ON public.nfc_orders TO anon;