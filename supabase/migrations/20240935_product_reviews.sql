-- Create product reviews table
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS marketplace_reviews_product_id_idx ON marketplace_reviews(product_id);
CREATE INDEX IF NOT EXISTS marketplace_reviews_user_id_idx ON marketplace_reviews(user_id);

-- Enable RLS
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view all reviews" ON marketplace_reviews;
CREATE POLICY "Users can view all reviews"
  ON marketplace_reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON marketplace_reviews;
CREATE POLICY "Users can insert their own reviews"
  ON marketplace_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON marketplace_reviews;
CREATE POLICY "Users can update their own reviews"
  ON marketplace_reviews FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON marketplace_reviews;
CREATE POLICY "Users can delete their own reviews"
  ON marketplace_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Add realtime
alter publication supabase_realtime add table marketplace_reviews;
