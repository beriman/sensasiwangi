-- Add fields for reply threads
ALTER TABLE IF EXISTS private_messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES private_messages(id),
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_forwarded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_message_id UUID REFERENCES private_messages(id);

-- Create index for reply threads
CREATE INDEX IF NOT EXISTS idx_private_messages_reply_to_id 
ON private_messages(reply_to_id);

-- Add function to update last_read_at when a message is read
CREATE OR REPLACE FUNCTION update_last_read()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the participant's last_read_at timestamp
  UPDATE private_conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = NEW.conversation_id
  AND user_id = auth.uid();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message read status
DROP TRIGGER IF EXISTS on_message_read ON private_messages;
CREATE TRIGGER on_message_read
AFTER SELECT ON private_messages
FOR EACH ROW
EXECUTE FUNCTION update_last_read();

-- Add function to handle message deletion
CREATE OR REPLACE FUNCTION handle_message_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow deletion if the message is from the current user
  IF OLD.sender_id != auth.uid() THEN
    RAISE EXCEPTION 'You can only delete your own messages';
  END IF;
  
  -- Mark as deleted instead of actually deleting
  NEW.content := '<p><em>Pesan ini telah dihapus</em></p>';
  NEW.is_deleted := true;
  NEW.deleted_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message deletion
DROP TRIGGER IF EXISTS on_message_delete ON private_messages;
CREATE TRIGGER on_message_delete
BEFORE UPDATE OF is_deleted ON private_messages
FOR EACH ROW
WHEN (NEW.is_deleted = true)
EXECUTE FUNCTION handle_message_deletion();
