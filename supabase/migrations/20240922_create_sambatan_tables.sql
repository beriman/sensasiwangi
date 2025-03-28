-- Create sambatan table
CREATE TABLE IF NOT EXISTS sambatan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiator_id UUID NOT NULL REFERENCES auth.users(id),
  product_id UUID NOT NULL REFERENCES marketplace_products(id),
  target_quantity INTEGER NOT NULL,
  current_quantity INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sambatan_participants table
CREATE TABLE IF NOT EXISTS sambatan_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sambatan_id UUID NOT NULL REFERENCES sambatan(id),
  participant_id UUID NOT NULL REFERENCES auth.users(id),
  quantity INTEGER NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'verified', 'cancelled')),
  payment_proof TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add is_sambatan, min_participants, max_participants to marketplace_products
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS is_sambatan BOOLEAN DEFAULT false;
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS min_participants INTEGER;
ALTER TABLE marketplace_products ADD COLUMN IF NOT EXISTS max_participants INTEGER;

-- Enable RLS
ALTER TABLE sambatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE sambatan_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for sambatan
DROP POLICY IF EXISTS "Users can view all sambatan" ON sambatan;
CREATE POLICY "Users can view all sambatan"
  ON sambatan FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create sambatan" ON sambatan;
CREATE POLICY "Users can create sambatan"
  ON sambatan FOR INSERT
  WITH CHECK (initiator_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own sambatan" ON sambatan;
CREATE POLICY "Users can update their own sambatan"
  ON sambatan FOR UPDATE
  USING (initiator_id = auth.uid());

-- Create policies for sambatan_participants
DROP POLICY IF EXISTS "Users can view all sambatan participants" ON sambatan_participants;
CREATE POLICY "Users can view all sambatan participants"
  ON sambatan_participants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can join sambatan" ON sambatan_participants;
CREATE POLICY "Users can join sambatan"
  ON sambatan_participants FOR INSERT
  WITH CHECK (participant_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own participation" ON sambatan_participants;
CREATE POLICY "Users can update their own participation"
  ON sambatan_participants FOR UPDATE
  USING (participant_id = auth.uid());

-- Enable realtime
alter publication supabase_realtime add table sambatan;
alter publication supabase_realtime add table sambatan_participants;
