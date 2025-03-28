-- Add sambatan notification type to forum_notifications table
ALTER TABLE forum_notifications ADD COLUMN IF NOT EXISTS sambatan_id UUID REFERENCES sambatan(id);

-- Create function to handle sambatan notifications
CREATE OR REPLACE FUNCTION create_sambatan_notification()
RETURNS TRIGGER AS $$
DECLARE
  product_name TEXT;
  initiator_name TEXT;
  participant_name TEXT;
  notification_message TEXT;
  notification_type TEXT;
BEGIN
  -- Get product name
  SELECT name INTO product_name FROM marketplace_products WHERE id = NEW.product_id;
  
  -- For new sambatan creation
  IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'sambatan' THEN
    -- Get initiator name
    SELECT full_name INTO initiator_name FROM users WHERE id = NEW.initiator_id;
    notification_type := 'sambatan_created';
    notification_message := initiator_name || ' memulai Sambatan untuk "' || product_name || '"';
    
    -- Notify seller
    INSERT INTO forum_notifications (user_id, message, type, thread_id, sambatan_id, read)
    SELECT seller_id, notification_message, notification_type, NULL, NEW.id, false
    FROM marketplace_products
    WHERE id = NEW.product_id;
    
  -- For sambatan status update
  ELSIF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'sambatan' AND OLD.status != NEW.status THEN
    notification_type := 'sambatan_status';
    
    IF NEW.status = 'closed' THEN
      notification_message := 'Sambatan untuk "' || product_name || '" telah mencapai kuota';
    ELSIF NEW.status = 'completed' THEN
      notification_message := 'Sambatan untuk "' || product_name || '" telah selesai';
    END IF;
    
    -- Notify all participants
    INSERT INTO forum_notifications (user_id, message, type, thread_id, sambatan_id, read)
    SELECT participant_id, notification_message, notification_type, NULL, NEW.id, false
    FROM sambatan_participants
    WHERE sambatan_id = NEW.id;
    
    -- Notify seller
    INSERT INTO forum_notifications (user_id, message, type, thread_id, sambatan_id, read)
    SELECT seller_id, notification_message, notification_type, NULL, NEW.id, false
    FROM marketplace_products
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle sambatan participant notifications
CREATE OR REPLACE FUNCTION create_sambatan_participant_notification()
RETURNS TRIGGER AS $$
DECLARE
  product_name TEXT;
  participant_name TEXT;
  notification_message TEXT;
  notification_type TEXT;
  sambatan_initiator_id UUID;
BEGIN
  -- Get sambatan initiator
  SELECT initiator_id, product_id INTO sambatan_initiator_id, product_name
  FROM sambatan s
  JOIN marketplace_products mp ON s.product_id = mp.id
  WHERE s.id = NEW.sambatan_id;
  
  -- Get participant name
  SELECT full_name INTO participant_name FROM users WHERE id = NEW.participant_id;
  
  -- For new participant
  IF TG_OP = 'INSERT' THEN
    notification_type := 'sambatan_joined';
    notification_message := participant_name || ' bergabung dengan Sambatan untuk "' || product_name || '"';
    
    -- Notify initiator (if not the same as participant)
    IF sambatan_initiator_id != NEW.participant_id THEN
      INSERT INTO forum_notifications (user_id, message, type, thread_id, sambatan_id, read)
      VALUES (sambatan_initiator_id, notification_message, notification_type, NULL, NEW.sambatan_id, false);
    END IF;
    
  -- For payment status update
  ELSIF TG_OP = 'UPDATE' AND OLD.payment_status != NEW.payment_status THEN
    notification_type := 'sambatan_payment';
    
    IF NEW.payment_status = 'verified' THEN
      notification_message := 'Pembayaran Anda untuk Sambatan "' || product_name || '" telah diverifikasi';
      
      -- Notify the participant whose payment was verified
      INSERT INTO forum_notifications (user_id, message, type, thread_id, sambatan_id, read)
      VALUES (NEW.participant_id, notification_message, notification_type, NULL, NEW.sambatan_id, false);
      
    ELSIF NEW.payment_status = 'cancelled' THEN
      notification_message := 'Pembayaran Anda untuk Sambatan "' || product_name || '" telah dibatalkan';
      
      -- Notify the participant whose payment was cancelled
      INSERT INTO forum_notifications (user_id, message, type, thread_id, sambatan_id, read)
      VALUES (NEW.participant_id, notification_message, notification_type, NULL, NEW.sambatan_id, false);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for sambatan notifications
DROP TRIGGER IF EXISTS sambatan_notification_trigger ON sambatan;
CREATE TRIGGER sambatan_notification_trigger
AFTER INSERT OR UPDATE
ON sambatan
FOR EACH ROW
EXECUTE FUNCTION create_sambatan_notification();

-- Create triggers for sambatan participant notifications
DROP TRIGGER IF EXISTS sambatan_participant_notification_trigger ON sambatan_participants;
CREATE TRIGGER sambatan_participant_notification_trigger
AFTER INSERT OR UPDATE
ON sambatan_participants
FOR EACH ROW
EXECUTE FUNCTION create_sambatan_participant_notification();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE forum_notifications;
