-- Create disputes table
CREATE TABLE IF NOT EXISTS marketplace_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES marketplace_transactions(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved_buyer', 'resolved_seller', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Create dispute messages table
CREATE TABLE IF NOT EXISTS marketplace_dispute_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispute_id UUID NOT NULL REFERENCES marketplace_disputes(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_from_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create refunds table
CREATE TABLE IF NOT EXISTS marketplace_refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES marketplace_transactions(id) ON DELETE CASCADE,
  dispute_id UUID REFERENCES marketplace_disputes(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  refund_reason TEXT NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add RLS policies for disputes
ALTER TABLE marketplace_disputes ENABLE ROW LEVEL SECURITY;

-- Buyers can see their own disputes
DROP POLICY IF EXISTS "Buyers can see their own disputes" ON marketplace_disputes;
CREATE POLICY "Buyers can see their own disputes"
  ON marketplace_disputes FOR SELECT
  USING (
    initiator_id = auth.uid() OR
    transaction_id IN (
      SELECT id FROM marketplace_transactions 
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

-- Initiators can create disputes
DROP POLICY IF EXISTS "Initiators can create disputes" ON marketplace_disputes;
CREATE POLICY "Initiators can create disputes"
  ON marketplace_disputes FOR INSERT
  WITH CHECK (
    initiator_id = auth.uid() AND
    transaction_id IN (
      SELECT id FROM marketplace_transactions WHERE buyer_id = auth.uid()
    )
  );

-- Only admins can update disputes
DROP POLICY IF EXISTS "Only admins can update disputes" ON marketplace_disputes;
CREATE POLICY "Only admins can update disputes"
  ON marketplace_disputes FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users WHERE role IN ('admin', 'super_admin'))
  );

-- Add RLS policies for dispute messages
ALTER TABLE marketplace_dispute_messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages for disputes they're involved in
DROP POLICY IF EXISTS "Users can see messages for disputes they're involved in" ON marketplace_dispute_messages;
CREATE POLICY "Users can see messages for disputes they're involved in"
  ON marketplace_dispute_messages FOR SELECT
  USING (
    dispute_id IN (
      SELECT id FROM marketplace_disputes
      WHERE initiator_id = auth.uid() OR
      transaction_id IN (
        SELECT id FROM marketplace_transactions 
        WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
      )
    ) OR
    auth.uid() IN (SELECT user_id FROM admin_users WHERE role IN ('admin', 'super_admin'))
  );

-- Users can send messages for disputes they're involved in
DROP POLICY IF EXISTS "Users can send messages for disputes they're involved in" ON marketplace_dispute_messages;
CREATE POLICY "Users can send messages for disputes they're involved in"
  ON marketplace_dispute_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    dispute_id IN (
      SELECT id FROM marketplace_disputes
      WHERE initiator_id = auth.uid() OR
      transaction_id IN (
        SELECT id FROM marketplace_transactions 
        WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
      )
    ) OR
    (auth.uid() IN (SELECT user_id FROM admin_users WHERE role IN ('admin', 'super_admin')) AND is_from_admin = true)
  );

-- Add RLS policies for refunds
ALTER TABLE marketplace_refunds ENABLE ROW LEVEL SECURITY;

-- Buyers can see their own refunds
DROP POLICY IF EXISTS "Buyers can see their own refunds" ON marketplace_refunds;
CREATE POLICY "Buyers can see their own refunds"
  ON marketplace_refunds FOR SELECT
  USING (
    transaction_id IN (
      SELECT id FROM marketplace_transactions 
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    ) OR
    auth.uid() IN (SELECT user_id FROM admin_users WHERE role IN ('admin', 'super_admin'))
  );

-- Only admins can create and update refunds
DROP POLICY IF EXISTS "Only admins can create refunds" ON marketplace_refunds;
CREATE POLICY "Only admins can create refunds"
  ON marketplace_refunds FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_users WHERE role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "Only admins can update refunds" ON marketplace_refunds;
CREATE POLICY "Only admins can update refunds"
  ON marketplace_refunds FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users WHERE role IN ('admin', 'super_admin'))
  );

-- Add realtime publication for disputes and messages
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_disputes;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_dispute_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_refunds;

-- Create function to get product rating
CREATE OR REPLACE FUNCTION get_product_rating(product_id UUID)
RETURNS TABLE (avg_rating NUMERIC, review_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating), 0)::NUMERIC AS avg_rating,
    COUNT(*)::BIGINT AS review_count
  FROM marketplace_reviews
  WHERE product_id = $1;
END;
$$ LANGUAGE plpgsql;
