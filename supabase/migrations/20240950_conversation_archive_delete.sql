-- Add is_archived and is_deleted columns to private_conversation_participants table
ALTER TABLE private_conversation_participants
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Update the RLS policies to respect the is_deleted flag
DROP POLICY IF EXISTS "Users can view their own conversations" ON private_conversation_participants;
CREATE POLICY "Users can view their own conversations"
  ON private_conversation_participants
  FOR SELECT
  USING (auth.uid() = user_id AND is_deleted = false);

-- Update the RLS policies to allow users to update their own conversation participation
DROP POLICY IF EXISTS "Users can update their own conversation participation" ON private_conversation_participants;
CREATE POLICY "Users can update their own conversation participation"
  ON private_conversation_participants
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add the conversation participation to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE private_conversation_participants;