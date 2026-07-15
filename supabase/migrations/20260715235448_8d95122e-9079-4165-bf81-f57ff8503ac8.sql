
-- Sequential invoice numbers + payment method for NFC orders

CREATE SEQUENCE IF NOT EXISTS public.nfc_invoice_seq START 1 INCREMENT 1;

ALTER TABLE public.nfc_orders
  ADD COLUMN IF NOT EXISTS invoice_number text UNIQUE,
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cod',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

-- Assign INV-XXXX (min 4 digits, grows automatically) on insert if not provided.
CREATE OR REPLACE FUNCTION public.assign_nfc_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || LPAD(nextval('public.nfc_invoice_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_nfc_invoice_number ON public.nfc_orders;
CREATE TRIGGER trg_assign_nfc_invoice_number
  BEFORE INSERT ON public.nfc_orders
  FOR EACH ROW EXECUTE FUNCTION public.assign_nfc_invoice_number();

-- Backfill invoice numbers for existing orders (oldest first)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.nfc_orders WHERE invoice_number IS NULL ORDER BY created_at ASC LOOP
    UPDATE public.nfc_orders
       SET invoice_number = 'INV-' || LPAD(nextval('public.nfc_invoice_seq')::text, 4, '0')
     WHERE id = r.id;
  END LOOP;
END $$;

-- Company info for invoices (single row, admin-editable). VAT/CR left blank for now.
CREATE TABLE IF NOT EXISTS public.invoice_company_settings (
  id int PRIMARY KEY DEFAULT 1,
  company_name text NOT NULL DEFAULT 'SmartCard',
  address_line1 text NOT NULL DEFAULT '',
  address_line2 text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT 'Saudi Arabia',
  vat_number text NOT NULL DEFAULT '',
  cr_number text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  logo_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT one_row_only CHECK (id = 1)
);

GRANT SELECT ON public.invoice_company_settings TO anon, authenticated;
GRANT ALL ON public.invoice_company_settings TO service_role;
ALTER TABLE public.invoice_company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read company info"
  ON public.invoice_company_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update company info"
  ON public.invoice_company_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert company info"
  ON public.invoice_company_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.invoice_company_settings (id, company_name, country)
VALUES (1, 'SmartCard', 'Saudi Arabia')
ON CONFLICT (id) DO NOTHING;
