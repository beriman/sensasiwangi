-- Enable Row Level Security (RLS) on private_conversations table
ALTER TABLE private_conversations ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security (RLS) on private_messages table
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security (RLS) on private_conversation_participants table
ALTER TABLE private_conversation_participants ENABLE ROW LEVEL SECURITY;

-- Create policy for private_conversations table
-- Users can only select conversations they are part of
DROP POLICY IF EXISTS "Users can view their conversations" ON private_conversations;
CREATE POLICY "Users can view their conversations"
ON private_conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM private_conversation_participants
    WHERE conversation_id = private_conversations.id
    AND user_id = auth.uid()
  )
);

-- Create policy for private_conversation_participants table
-- Users can only select their own participation records
DROP POLICY IF EXISTS "Users can view their participation" ON private_conversation_participants;
CREATE POLICY "Users can view their participation"
ON private_conversation_participants
FOR SELECT
USING (user_id = auth.uid());

-- Create policies for private_messages table
-- Users can only select messages from conversations they are part of
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON private_messages;
CREATE POLICY "Users can view messages in their conversations"
ON private_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM private_conversation_participants
    WHERE conversation_id = private_messages.conversation_id
    AND user_id = auth.uid()
  )
);

-- Users can only insert messages into conversations they are part of
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON private_messages;
CREATE POLICY "Users can insert messages in their conversations"
ON private_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM private_conversation_participants
    WHERE conversation_id = private_messages.conversation_id
    AND user_id = auth.uid()
  )
  AND sender_id = auth.uid() -- Ensure the sender_id is the current user
);

-- Users can only update their own messages
DROP POLICY IF EXISTS "Users can update their own messages" ON private_messages;
CREATE POLICY "Users can update their own messages"
ON private_messages
FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Users can only delete their own messages
DROP POLICY IF EXISTS "Users can delete their own messages" ON private_messages;
CREATE POLICY "Users can delete their own messages"
ON private_messages
FOR DELETE
USING (sender_id = auth.uid());

-- Add tables to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'private_conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE private_conversations;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'private_conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE private_conversation_participants;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'private_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE private_messages;
  END IF;
END
$$;