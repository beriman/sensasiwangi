-- Add is_admin field to private_conversation_participants table
ALTER TABLE IF EXISTS private_conversation_participants 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create chat_notifications table
CREATE TABLE IF NOT EXISTS chat_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES private_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_preview TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, conversation_id, sender_id, message_preview)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_notifications_user_id 
ON chat_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_notifications_conversation_id 
ON chat_notifications(conversation_id);

CREATE INDEX IF NOT EXISTS idx_chat_notifications_read 
ON chat_notifications(read);

-- Enable RLS for chat_notifications
ALTER TABLE chat_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_notifications
CREATE POLICY "Users can view their own notifications" 
ON chat_notifications FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON chat_notifications FOR UPDATE 
USING (user_id = auth.uid());

-- Create function to generate chat notifications
CREATE OR REPLACE FUNCTION create_chat_notification()
RETURNS TRIGGER AS $$
DECLARE
  message_content TEXT;
  conversation_participants RECORD;
BEGIN
  -- Extract plain text from HTML content for preview
  message_content := regexp_replace(NEW.content, '<[^>]*>', '', 'g');
  
  -- Limit preview to 50 characters
  IF length(message_content) > 50 THEN
    message_content := substring(message_content, 1, 47) || '...';
  END IF;
  
  -- Create notification for each participant except the sender
  FOR conversation_participants IN 
    SELECT user_id 
    FROM private_conversation_participants 
    WHERE conversation_id = NEW.conversation_id 
    AND user_id != NEW.sender_id
  LOOP
    INSERT INTO chat_notifications (
      user_id, 
      conversation_id, 
      sender_id, 
      message_preview
    ) 
    VALUES (
      conversation_participants.user_id,
      NEW.conversation_id,
      NEW.sender_id,
      message_content
    )
    ON CONFLICT (user_id, conversation_id, sender_id, message_preview) 
    DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS on_new_message ON private_messages;
CREATE TRIGGER on_new_message
AFTER INSERT ON private_messages
FOR EACH ROW
WHEN (NEW.is_system_message IS NULL OR NEW.is_system_message = false)
EXECUTE FUNCTION create_chat_notification();

-- Add typing status tracking
CREATE OR REPLACE FUNCTION update_typing_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Broadcast typing status to conversation channel
  PERFORM pg_notify(
    'typing_' || NEW.conversation_id,
    json_build_object(
      'user_id', NEW.sender_id,
      'conversation_id', NEW.conversation_id,
      'typing', true
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for typing status
DROP TRIGGER IF EXISTS on_typing ON private_messages;
CREATE TRIGGER on_typing
BEFORE INSERT ON private_messages
FOR EACH ROW
EXECUTE FUNCTION update_typing_status();
