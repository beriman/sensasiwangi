-- Add shipping_city to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'shipping_city') THEN
    ALTER TABLE profiles ADD COLUMN shipping_city text;
  END IF;
END $$;

-- Add shipping_optimization table for sambatan
CREATE TABLE IF NOT EXISTS sambatan_shipping_optimization (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sambatan_id uuid REFERENCES sambatan(id) ON DELETE CASCADE,
  provider_code text NOT NULL,
  total_cost integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add participant shipping rates table
CREATE TABLE IF NOT EXISTS sambatan_participant_shipping (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  optimization_id uuid REFERENCES sambatan_shipping_optimization(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  shipping_rate_id text NOT NULL,
  shipping_cost integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(optimization_id, participant_id)
);

-- Add RLS policies
ALTER TABLE sambatan_shipping_optimization ENABLE ROW LEVEL SECURITY;
ALTER TABLE sambatan_participant_shipping ENABLE ROW LEVEL SECURITY;

-- Everyone can read shipping optimization data
DROP POLICY IF EXISTS "Anyone can read sambatan shipping optimization" ON sambatan_shipping_optimization;
CREATE POLICY "Anyone can read sambatan shipping optimization"
  ON sambatan_shipping_optimization
  FOR SELECT
  USING (true);

-- Only authenticated users can insert/update shipping optimization
DROP POLICY IF EXISTS "Authenticated users can insert sambatan shipping optimization" ON sambatan_shipping_optimization;
CREATE POLICY "Authenticated users can insert sambatan shipping optimization"
  ON sambatan_shipping_optimization
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update sambatan shipping optimization" ON sambatan_shipping_optimization;
CREATE POLICY "Authenticated users can update sambatan shipping optimization"
  ON sambatan_shipping_optimization
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Everyone can read participant shipping data
DROP POLICY IF EXISTS "Anyone can read sambatan participant shipping" ON sambatan_participant_shipping;
CREATE POLICY "Anyone can read sambatan participant shipping"
  ON sambatan_participant_shipping
  FOR SELECT
  USING (true);

-- Only authenticated users can insert/update participant shipping
DROP POLICY IF EXISTS "Authenticated users can insert sambatan participant shipping" ON sambatan_participant_shipping;
CREATE POLICY "Authenticated users can insert sambatan participant shipping"
  ON sambatan_participant_shipping
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update sambatan participant shipping" ON sambatan_participant_shipping;
CREATE POLICY "Authenticated users can update sambatan participant shipping"
  ON sambatan_participant_shipping
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Add realtime publication for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE sambatan_shipping_optimization;
ALTER PUBLICATION supabase_realtime ADD TABLE sambatan_participant_shipping;
