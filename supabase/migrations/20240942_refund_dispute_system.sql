-- Create marketplace_disputes table first
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

-- Enable RLS on marketplace_disputes
ALTER TABLE marketplace_disputes ENABLE ROW LEVEL SECURITY;

-- Create marketplace_dispute_messages table
CREATE TABLE IF NOT EXISTS marketplace_dispute_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispute_id UUID NOT NULL REFERENCES marketplace_disputes(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_from_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on marketplace_dispute_messages
ALTER TABLE marketplace_dispute_messages ENABLE ROW LEVEL SECURITY;

-- Create marketplace_refunds table
CREATE TABLE IF NOT EXISTS marketplace_refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES marketplace_transactions(id) ON DELETE CASCADE,
  dispute_id UUID REFERENCES marketplace_disputes(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  refund_reason TEXT NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS on marketplace_refunds
ALTER TABLE marketplace_refunds ENABLE ROW LEVEL SECURITY;

-- Create policies for marketplace_disputes
CREATE POLICY "Users can view their own disputes" 
ON marketplace_disputes 
FOR SELECT 
USING (
  auth.uid() = initiator_id OR 
  auth.uid() IN (
    SELECT seller_id FROM marketplace_transactions WHERE id = transaction_id
  )
);

CREATE POLICY "Users can create disputes" 
ON marketplace_disputes 
FOR INSERT 
WITH CHECK (
  auth.uid() = initiator_id AND
  auth.uid() IN (
    SELECT buyer_id FROM marketplace_transactions WHERE id = transaction_id
  )
);

CREATE POLICY "Users can update their own disputes" 
ON marketplace_disputes 
FOR UPDATE 
USING (auth.uid() = initiator_id)
WITH CHECK (status = 'pending');

-- Create policies for marketplace_dispute_messages
CREATE POLICY "Users can view messages for their disputes" 
ON marketplace_dispute_messages 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT initiator_id FROM marketplace_disputes WHERE id = dispute_id
  ) OR
  auth.uid() IN (
    SELECT seller_id FROM marketplace_transactions 
    WHERE id IN (SELECT transaction_id FROM marketplace_disputes WHERE id = dispute_id)
  )
);

CREATE POLICY "Users can create messages for their disputes" 
ON marketplace_dispute_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  (auth.uid() IN (
    SELECT initiator_id FROM marketplace_disputes WHERE id = dispute_id
  ) OR
  auth.uid() IN (
    SELECT seller_id FROM marketplace_transactions 
    WHERE id IN (SELECT transaction_id FROM marketplace_disputes WHERE id = dispute_id)
  ))
);

-- Create policies for marketplace_refunds
CREATE POLICY "Users can view their own refunds" 
ON marketplace_refunds 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT buyer_id FROM marketplace_transactions WHERE id = transaction_id
  ) OR
  auth.uid() IN (
    SELECT seller_id FROM marketplace_transactions WHERE id = transaction_id
  )
);

-- Add admin policies
CREATE POLICY "Admins can view all disputes" 
ON marketplace_disputes 
FOR SELECT 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update all disputes" 
ON marketplace_disputes 
FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all dispute messages" 
ON marketplace_dispute_messages 
FOR SELECT 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can create dispute messages" 
ON marketplace_dispute_messages 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all refunds" 
ON marketplace_refunds 
FOR SELECT 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can create refunds" 
ON marketplace_refunds 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update refunds" 
ON marketplace_refunds 
FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'admin');

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_disputes;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_dispute_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_refunds;
