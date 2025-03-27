-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own wishlists" ON wishlists;
CREATE POLICY "Users can view their own wishlists"
  ON wishlists FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert into their own wishlists" ON wishlists;
CREATE POLICY "Users can insert into their own wishlists"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete from their own wishlists" ON wishlists;
CREATE POLICY "Users can delete from their own wishlists"
  ON wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- Add to realtime publication
alter publication supabase_realtime add table wishlists;
