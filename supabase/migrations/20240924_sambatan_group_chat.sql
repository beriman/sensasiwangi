-- Add is_group field to private_conversations table
ALTER TABLE IF EXISTS private_conversations 
ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_system_message BOOLEAN DEFAULT false;

-- Create table to link sambatan with group conversations
CREATE TABLE IF NOT EXISTS sambatan_group_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sambatan_id UUID NOT NULL REFERENCES sambatan(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES private_conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sambatan_id, conversation_id)
);

-- Add is_system_message field to private_messages table
ALTER TABLE IF EXISTS private_messages 
ADD COLUMN IF NOT EXISTS is_system_message BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sambatan_group_conversations_sambatan_id 
ON sambatan_group_conversations(sambatan_id);

CREATE INDEX IF NOT EXISTS idx_sambatan_group_conversations_conversation_id 
ON sambatan_group_conversations(conversation_id);

-- Enable RLS for sambatan_group_conversations
ALTER TABLE sambatan_group_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for sambatan_group_conversations
CREATE POLICY "Anyone can view sambatan group conversations" 
ON sambatan_group_conversations FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create sambatan group conversations" 
ON sambatan_group_conversations FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Update private_conversation_participants policies to allow group chat access
DROP POLICY IF EXISTS "Users can view their own conversation participants" ON private_conversation_participants;
CREATE POLICY "Users can view conversation participants" 
ON private_conversation_participants FOR SELECT 
USING (
  user_id = auth.uid() OR 
  conversation_id IN (
    SELECT conversation_id FROM private_conversation_participants WHERE user_id = auth.uid()
  )
);

-- Update private_messages policies to allow group chat access
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON private_messages;
CREATE POLICY "Users can view messages in their conversations" 
ON private_messages FOR SELECT 
USING (
  conversation_id IN (
    SELECT conversation_id FROM private_conversation_participants WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON private_messages;
CREATE POLICY "Users can send messages to their conversations" 
ON private_messages FOR INSERT 
TO authenticated 
WITH CHECK (
  conversation_id IN (
    SELECT conversation_id FROM private_conversation_participants WHERE user_id = auth.uid()
  )
);

-- Add online_status and last_active columns to users table if they don't exist
ALTER TABLE IF EXISTS users 
ADD COLUMN IF NOT EXISTS online_status BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE;
