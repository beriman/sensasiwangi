-- Create a function to check and update sambatan status
CREATE OR REPLACE FUNCTION check_and_update_sambatan_status(sambatan_id UUID)
RETURNS VOID AS $$
DECLARE
  sambatan_record RECORD;
  all_verified BOOLEAN;
BEGIN
  -- Get the sambatan record
  SELECT * INTO sambatan_record FROM sambatan WHERE id = sambatan_id;
  
  -- Only proceed if sambatan is closed or open (with all slots filled)
  IF sambatan_record.status NOT IN ('closed', 'open') THEN
    RETURN;
  END IF;
  
  -- Check if all participants have verified payments
  SELECT COUNT(*) = 0 INTO all_verified
  FROM sambatan_participants
  WHERE sambatan_id = sambatan_id AND payment_status != 'verified';
  
  -- If sambatan is open but all slots are filled, close it first
  IF sambatan_record.status = 'open' AND sambatan_record.current_quantity >= sambatan_record.target_quantity THEN
    UPDATE sambatan
    SET status = 'closed', updated_at = NOW()
    WHERE id = sambatan_id;
  END IF;
  
  -- If all payments are verified, mark sambatan as completed
  IF all_verified THEN
    UPDATE sambatan
    SET status = 'completed', updated_at = NOW()
    WHERE id = sambatan_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically check sambatan status when a payment is verified
CREATE OR REPLACE FUNCTION sambatan_payment_verification_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- If payment status changed to verified, check and update sambatan status
  IF NEW.payment_status = 'verified' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'verified') THEN
    PERFORM check_and_update_sambatan_status(NEW.sambatan_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS sambatan_payment_verification_trigger ON sambatan_participants;

-- Create the trigger
CREATE TRIGGER sambatan_payment_verification_trigger
AFTER UPDATE ON sambatan_participants
FOR EACH ROW
EXECUTE FUNCTION sambatan_payment_verification_trigger();

-- Add a notification function for payment verification
CREATE OR REPLACE FUNCTION notify_payment_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify on the sambatan_updates channel
  PERFORM pg_notify(
    'sambatan_updates',
    json_build_object(
      'event', 'payment_verification',
      'sambatan_id', NEW.sambatan_id,
      'participant_id', NEW.participant_id,
      'payment_status', NEW.payment_status
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS notify_payment_verification_trigger ON sambatan_participants;

-- Create the trigger
CREATE TRIGGER notify_payment_verification_trigger
AFTER UPDATE OF payment_status ON sambatan_participants
FOR EACH ROW
EXECUTE FUNCTION notify_payment_verification();

-- Enable realtime for sambatan_participants table if not already enabled
ALTER PUBLICATION supabase_realtime ADD TABLE sambatan_participants;
