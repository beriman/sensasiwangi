-- Create marketplace_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS marketplace_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified', 'cancelled')),
  payment_proof TEXT,
  shipping_status TEXT DEFAULT 'pending' CHECK (shipping_status IN ('pending', 'processing', 'shipped', 'delivered')),
  shipping_tracking_number TEXT,
  shipping_provider_id TEXT,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  sambatan_id UUID,
  used_optimized_shipping BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on marketplace_transactions
ALTER TABLE marketplace_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for marketplace_transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON marketplace_transactions;
CREATE POLICY "Users can view their own transactions" 
ON marketplace_transactions 
FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON marketplace_transactions;
CREATE POLICY "Admins can view all transactions" 
ON marketplace_transactions 
FOR SELECT 
USING (auth.jwt() ->> 'role' = 'admin');

-- Enable realtime for marketplace_transactions (only if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'marketplace_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_transactions;
  END IF;
END
$$;