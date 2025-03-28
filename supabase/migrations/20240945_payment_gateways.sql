-- Create payment gateways table
CREATE TABLE IF NOT EXISTS payment_gateways (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bank accounts table for bank transfers
CREATE TABLE IF NOT EXISTS payment_bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payment gateways
INSERT INTO payment_gateways (id, name, logo_url, description, is_active)
VALUES
  ('QRIS', 'QRIS', 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=200&q=80', 'Bayar dengan scan QR code dari aplikasi e-wallet atau mobile banking', TRUE),
  ('OVO', 'OVO', 'https://images.unsplash.com/photo-1622012864015-a832e1b3a3c4?w=200&q=80', 'Bayar langsung menggunakan saldo OVO', TRUE),
  ('GOPAY', 'GoPay', 'https://images.unsplash.com/photo-1622012849272-a81f1d5eb0a9?w=200&q=80', 'Bayar langsung menggunakan saldo GoPay', TRUE),
  ('DANA', 'DANA', 'https://images.unsplash.com/photo-1622012847664-b8e3e0a3b777?w=200&q=80', 'Bayar langsung menggunakan saldo DANA', TRUE),
  ('LINKAJA', 'LinkAja', 'https://images.unsplash.com/photo-1622012847664-b8e3e0a3b777?w=200&q=80', 'Bayar langsung menggunakan saldo LinkAja', TRUE),
  ('SHOPEEPAY', 'ShopeePay', 'https://images.unsplash.com/photo-1622012847664-b8e3e0a3b777?w=200&q=80', 'Bayar langsung menggunakan saldo ShopeePay', TRUE),
  ('BANK_TRANSFER', 'Transfer Bank', 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=200&q=80', 'Transfer manual ke rekening bank kami', TRUE),
  ('VIRTUAL_ACCOUNT', 'Virtual Account', 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=200&q=80', 'Bayar melalui virtual account bank', TRUE),
  ('CREDIT_CARD', 'Kartu Kredit', 'https://images.unsplash.com/photo-1622012864015-a832e1b3a3c4?w=200&q=80', 'Bayar dengan kartu kredit', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Insert default bank accounts
INSERT INTO payment_bank_accounts (bank_name, account_number, account_holder, is_active)
VALUES
  ('BCA', '1234567890', 'Sensasi Wangi Indonesia', TRUE),
  ('Mandiri', '0987654321', 'Sensasi Wangi Indonesia', TRUE),
  ('BNI', '1122334455', 'Sensasi Wangi Indonesia', TRUE)
ON CONFLICT DO NOTHING;

-- Check if marketplace_orders table exists before altering it
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketplace_orders') THEN
    -- Add payment gateway fields to marketplace_orders table
    ALTER TABLE marketplace_orders
    ADD COLUMN IF NOT EXISTS payment_gateway_id TEXT REFERENCES payment_gateways(id),
    ADD COLUMN IF NOT EXISTS payment_code TEXT,
    ADD COLUMN IF NOT EXISTS payment_redirect_url TEXT;
  END IF;
END
$$;

-- Create RLS policies
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_gateways
DROP POLICY IF EXISTS "Public read access for payment_gateways" ON payment_gateways;
CREATE POLICY "Public read access for payment_gateways"
ON payment_gateways FOR SELECT
USING (is_active = true);

-- Create policies for payment_bank_accounts
DROP POLICY IF EXISTS "Public read access for payment_bank_accounts" ON payment_bank_accounts;
CREATE POLICY "Public read access for payment_bank_accounts"
ON payment_bank_accounts FOR SELECT
USING (is_active = true);

-- Create function to get payment gateways
CREATE OR REPLACE FUNCTION get_payment_gateways()
RETURNS SETOF payment_gateways
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM payment_gateways
  WHERE is_active = true
  ORDER BY name;
END;
$$;
