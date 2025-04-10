-- Create marketplace_orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_price DECIMAL(12, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_proof TEXT,
  payment_verified_at TIMESTAMPTZ,
  payment_verified_by UUID REFERENCES auth.users(id),
  shipping_address JSONB NOT NULL,
  shipping_method VARCHAR(100),
  shipping_cost DECIMAL(12, 2),
  tracking_number VARCHAR(100),
  invoice_number VARCHAR(100) UNIQUE,
  payment_method VARCHAR(50),
  payment_gateway_id VARCHAR(50),
  payment_transaction_id VARCHAR(100),
  items JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer_id ON marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller_id ON marketplace_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_payment_status ON marketplace_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_created_at ON marketplace_orders(created_at);

-- Enable RLS
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Buyers can view their own orders" ON marketplace_orders;
CREATE POLICY "Buyers can view their own orders"
  ON marketplace_orders FOR SELECT
  USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Sellers can view orders for their products" ON marketplace_orders;
CREATE POLICY "Sellers can view orders for their products"
  ON marketplace_orders FOR SELECT
  USING (auth.uid() = seller_id);

DROP POLICY IF EXISTS "Buyers can create orders" ON marketplace_orders;
CREATE POLICY "Buyers can create orders"
  ON marketplace_orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Buyers can update their own orders" ON marketplace_orders;
CREATE POLICY "Buyers can update their own orders"
  ON marketplace_orders FOR UPDATE
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id AND (
    -- Buyers can only update payment_proof and notes
    (OLD.payment_proof IS NULL AND NEW.payment_proof IS NOT NULL) OR
    (OLD.notes IS NULL AND NEW.notes IS NOT NULL) OR
    (OLD.notes IS NOT NULL AND NEW.notes IS NOT NULL AND OLD.notes != NEW.notes)
  ));

DROP POLICY IF EXISTS "Sellers can update their own orders" ON marketplace_orders;
CREATE POLICY "Sellers can update their own orders"
  ON marketplace_orders FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id AND (
    -- Sellers can only update status, tracking_number and notes
    (OLD.status != NEW.status) OR
    (OLD.tracking_number IS NULL AND NEW.tracking_number IS NOT NULL) OR
    (OLD.tracking_number IS NOT NULL AND NEW.tracking_number IS NOT NULL AND OLD.tracking_number != NEW.tracking_number) OR
    (OLD.notes IS NULL AND NEW.notes IS NOT NULL) OR
    (OLD.notes IS NOT NULL AND NEW.notes IS NOT NULL AND OLD.notes != NEW.notes)
  ));

DROP POLICY IF EXISTS "Admins can do everything" ON marketplace_orders;
CREATE POLICY "Admins can do everything"
  ON marketplace_orders
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_metadata->>'role' = 'admin'
    )
  );

-- Create function to notify on order status change
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    -- Insert notification for buyer
    INSERT INTO notifications (user_id, type, content, reference_id)
    VALUES (
      NEW.buyer_id,
      'order_status_change',
      json_build_object('order_id', NEW.id, 'status', NEW.status, 'invoice_number', NEW.invoice_number),
      NEW.id
    );
    
    -- Insert notification for seller if status is 'pending' (new order)
    IF NEW.status = 'pending' THEN
      INSERT INTO notifications (user_id, type, content, reference_id)
      VALUES (
        NEW.seller_id,
        'new_order',
        json_build_object('order_id', NEW.id, 'invoice_number', NEW.invoice_number),
        NEW.id
      );
    END IF;
  END IF;
  
  IF OLD.payment_status != NEW.payment_status AND NEW.payment_status = 'verified' THEN
    -- Insert notification for buyer when payment is verified
    INSERT INTO notifications (user_id, type, content, reference_id)
    VALUES (
      NEW.buyer_id,
      'payment_verified',
      json_build_object('order_id', NEW.id, 'invoice_number', NEW.invoice_number),
      NEW.id
    );
    
    -- Insert notification for seller when payment is verified
    INSERT INTO notifications (user_id, type, content, reference_id)
    VALUES (
      NEW.seller_id,
      'payment_verified',
      json_build_object('order_id', NEW.id, 'invoice_number', NEW.invoice_number),
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order status change notifications
DROP TRIGGER IF EXISTS trigger_order_status_change ON marketplace_orders;
CREATE TRIGGER trigger_order_status_change
  AFTER UPDATE ON marketplace_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content JSONB NOT NULL,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND (
    -- Users can only update is_read
    (OLD.is_read != NEW.is_read)
  ));

DROP POLICY IF EXISTS "Admins can do everything with notifications" ON notifications;
CREATE POLICY "Admins can do everything with notifications"
  ON notifications
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_metadata->>'role' = 'admin'
    )
  );

-- Add realtime publication for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
