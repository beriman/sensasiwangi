-- Add moderation_status column to marketplace_products if it doesn't exist
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_marketplace_products_moderation_status ON marketplace_products(moderation_status);

-- Add realtime publication for marketplace_products
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_products;

-- Create RLS policies for marketplace_products moderation
-- Allow admins to update moderation status
DROP POLICY IF EXISTS "Admins can update product moderation status" ON marketplace_products;
CREATE POLICY "Admins can update product moderation status"
ON marketplace_products FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = auth.users.id AND auth.users.user_metadata->>'role' = 'admin'
  )
);

-- Allow sellers to see moderation status of their own products
DROP POLICY IF EXISTS "Sellers can see moderation status of their products" ON marketplace_products;
CREATE POLICY "Sellers can see moderation status of their products"
ON marketplace_products FOR SELECT
USING (
  marketplace_products.seller_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = auth.users.id AND auth.users.user_metadata->>'role' = 'admin'
  )
);
