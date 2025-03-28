-- Create shipping_providers table
CREATE TABLE IF NOT EXISTS shipping_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add shipping address fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS shipping_city TEXT,
ADD COLUMN IF NOT EXISTS shipping_province TEXT,
ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT,
ADD COLUMN IF NOT EXISTS shipping_phone TEXT;

-- Add shipping fields to marketplace_orders table
ALTER TABLE marketplace_orders
ADD COLUMN IF NOT EXISTS shipping_provider_id UUID REFERENCES shipping_providers(id),
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_tracking_number TEXT,
ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS shipping_city TEXT,
ADD COLUMN IF NOT EXISTS shipping_province TEXT,
ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT,
ADD COLUMN IF NOT EXISTS shipping_phone TEXT;

-- Insert default shipping providers
INSERT INTO shipping_providers (name, code, logo_url)
VALUES 
('JNE', 'jne', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80'),
('J&T Express', 'jnt', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80'),
('SiCepat', 'sicepat', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80'),
('Pos Indonesia', 'pos', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80'),
('AnterAja', 'anteraja', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80')
ON CONFLICT (code) DO NOTHING;

-- Create shipping_rates table for different shipping options
CREATE TABLE IF NOT EXISTS shipping_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES shipping_providers(id) NOT NULL,
  origin_city TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  service_type TEXT NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  estimated_days INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id, origin_city, destination_city, service_type)
);

-- Create shipping_tracking_updates table
CREATE TABLE IF NOT EXISTS shipping_tracking_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES marketplace_orders(id) NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  location TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE shipping_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public shipping_providers are viewable by everyone" 
ON shipping_providers FOR SELECT USING (true);

ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public shipping_rates are viewable by everyone" 
ON shipping_rates FOR SELECT USING (true);

ALTER TABLE shipping_tracking_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shipping updates viewable by order buyer and seller" 
ON shipping_tracking_updates FOR SELECT USING (
  order_id IN (
    SELECT id FROM marketplace_orders WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
  )
);

-- Enable realtime for tracking updates
ALTER PUBLICATION supabase_realtime ADD TABLE shipping_tracking_updates;
