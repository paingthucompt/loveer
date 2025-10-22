-- Add preferred payout currency to clients table
ALTER TABLE public.clients
ADD COLUMN preferred_payout_currency TEXT DEFAULT 'THB';

-- Rename amount column to incoming_amount_thb in transactions table
ALTER TABLE public.transactions
RENAME COLUMN amount TO incoming_amount_thb;

-- Add new currency-related columns to transactions table
ALTER TABLE public.transactions
ADD COLUMN exchange_rate_mmk NUMERIC(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN payout_currency TEXT DEFAULT 'THB',
ADD COLUMN payout_amount NUMERIC(15,2);

-- Update existing transactions with calculated payout amounts
-- For existing data, we'll assume THB currency and calculate net based on commission
UPDATE public.transactions t
SET 
  payout_currency = 'THB',
  payout_amount = t.incoming_amount_thb - (
    t.incoming_amount_thb * (
      SELECT COALESCE(c.commission_percentage, 0) / 100 
      FROM public.clients c 
      WHERE c.id = t.client_id
    )
  ) - t.fees
WHERE payout_amount IS NULL;