-- Add role column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Create marketplace_transactions table
CREATE TABLE IF NOT EXISTS public.marketplace_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.users(id),
  buyer_id UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  product_name VARCHAR(255) NOT NULL,
  product_description TEXT
);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  badge_name VARCHAR(100) NOT NULL,
  badge_description TEXT,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add policies for the new tables
ALTER TABLE public.marketplace_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Policies for marketplace_transactions
DROP POLICY IF EXISTS "Admins can see all transactions" ON marketplace_transactions;
CREATE POLICY "Admins can see all transactions"
  ON marketplace_transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

DROP POLICY IF EXISTS "Users can see their own transactions" ON marketplace_transactions;
CREATE POLICY "Users can see their own transactions"
  ON marketplace_transactions FOR SELECT
  USING (seller_id = auth.uid() OR buyer_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update transactions" ON marketplace_transactions;
CREATE POLICY "Admins can update transactions"
  ON marketplace_transactions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Policies for user_badges
DROP POLICY IF EXISTS "Admins can manage badges" ON user_badges;
CREATE POLICY "Admins can manage badges"
  ON user_badges FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

DROP POLICY IF EXISTS "Users can view their badges" ON user_badges;
CREATE POLICY "Users can view their badges"
  ON user_badges FOR SELECT
  USING (user_id = auth.uid());

-- Add realtime for new tables
alter publication supabase_realtime add table marketplace_transactions;
alter publication supabase_realtime add table user_badges;
