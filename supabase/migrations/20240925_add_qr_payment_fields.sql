-- Add QR Code Dinamis payment fields to marketplace_orders table
ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(255) UNIQUE;
ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Add realtime publication for marketplace_orders
alter publication supabase_realtime add table marketplace_orders;
