-- Add service_code field to shipping_rates table
ALTER TABLE shipping_rates ADD COLUMN IF NOT EXISTS service_code TEXT;

-- Add weight field to shipping_rates table
ALTER TABLE shipping_rates ADD COLUMN IF NOT EXISTS weight INTEGER;

-- Create shipping_tracking_updates table if not exists
CREATE TABLE IF NOT EXISTS shipping_tracking_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  description TEXT,
  location TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_shipping_tracking_updates_order_id ON shipping_tracking_updates(order_id);

-- Add shipping_status field to marketplace_orders table if not exists
ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS shipping_status TEXT;

-- Add estimated_delivery_date field to marketplace_orders table if not exists
ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMPTZ;

-- Enable realtime for shipping_tracking_updates
ALTER PUBLICATION supabase_realtime ADD TABLE shipping_tracking_updates;
