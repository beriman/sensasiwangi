-- Create marketplace_products table
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Public read access" ON marketplace_products;
CREATE POLICY "Public read access"
  ON marketplace_products FOR SELECT
  USING (status = 'active');

DROP POLICY IF EXISTS "Sellers can manage their products" ON marketplace_products;
CREATE POLICY "Sellers can manage their products"
  ON marketplace_products FOR ALL
  USING (seller_id = auth.uid());

-- Enable realtime
alter publication supabase_realtime add table marketplace_products;
