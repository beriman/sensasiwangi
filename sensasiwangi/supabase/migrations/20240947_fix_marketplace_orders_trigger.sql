-- Fix the trigger function for marketplace_orders

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS notify_seller_on_new_order ON marketplace_orders;

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS notify_seller_on_new_order();

-- Create the corrected function
CREATE OR REPLACE FUNCTION notify_seller_on_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed for INSERT operations
  IF (TG_OP = 'INSERT') THEN
    -- Insert notification for seller
    INSERT INTO notifications (user_id, type, content, reference_id)
    VALUES (
      NEW.seller_id,
      'new_order',
      jsonb_build_object(
        'order_id', NEW.id,
        'invoice_number', NEW.invoice_number,
        'total_price', NEW.total_price,
        'message', 'Anda memiliki pesanan baru'
      ),
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER notify_seller_on_new_order
AFTER INSERT ON marketplace_orders
FOR EACH ROW
EXECUTE FUNCTION notify_seller_on_new_order();

-- Create a trigger function for order status changes
CREATE OR REPLACE FUNCTION notify_on_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed for UPDATE operations where status has changed
  IF (TG_OP = 'UPDATE' AND OLD.status <> NEW.status) THEN
    -- Notify buyer about status change
    INSERT INTO notifications (user_id, type, content, reference_id)
    VALUES (
      NEW.buyer_id,
      'order_status_change',
      jsonb_build_object(
        'order_id', NEW.id,
        'invoice_number', NEW.invoice_number,
        'status', NEW.status,
        'message', 'Status pesanan Anda telah berubah menjadi ' || NEW.status
      ),
      NEW.id
    );
    
    -- If status is 'shipped', also notify seller
    IF NEW.status = 'shipped' THEN
      INSERT INTO notifications (user_id, type, content, reference_id)
      VALUES (
        NEW.seller_id,
        'order_shipped',
        jsonb_build_object(
          'order_id', NEW.id,
          'invoice_number', NEW.invoice_number,
          'message', 'Pesanan telah dikirim ke pembeli'
        ),
        NEW.id
      );
    END IF;
  END IF;
  
  -- Notify on payment status change
  IF (TG_OP = 'UPDATE' AND OLD.payment_status <> NEW.payment_status) THEN
    -- Notify buyer about payment status change
    INSERT INTO notifications (user_id, type, content, reference_id)
    VALUES (
      NEW.buyer_id,
      'payment_status_change',
      jsonb_build_object(
        'order_id', NEW.id,
        'invoice_number', NEW.invoice_number,
        'payment_status', NEW.payment_status,
        'message', 'Status pembayaran Anda telah berubah menjadi ' || NEW.payment_status
      ),
      NEW.id
    );
    
    -- If payment is verified, also notify seller
    IF NEW.payment_status = 'verified' THEN
      INSERT INTO notifications (user_id, type, content, reference_id)
      VALUES (
        NEW.seller_id,
        'payment_verified',
        jsonb_build_object(
          'order_id', NEW.id,
          'invoice_number', NEW.invoice_number,
          'message', 'Pembayaran untuk pesanan telah diverifikasi'
        ),
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for status changes
DROP TRIGGER IF EXISTS notify_on_order_status_change ON marketplace_orders;

CREATE TRIGGER notify_on_order_status_change
AFTER UPDATE ON marketplace_orders
FOR EACH ROW
EXECUTE FUNCTION notify_on_order_status_change();
