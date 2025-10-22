-- Change bank_account column from TEXT to JSONB to support multiple bank accounts
ALTER TABLE public.clients 
ALTER COLUMN bank_account TYPE jsonb USING 
  CASE 
    WHEN bank_account IS NULL OR bank_account = '' THEN '[]'::jsonb
    ELSE jsonb_build_array(jsonb_build_object('bank_name', 'Legacy', 'account_number', bank_account))
  END;

-- Set default value for bank_account to empty JSON array
ALTER TABLE public.clients 
ALTER COLUMN bank_account SET DEFAULT '[]'::jsonb;