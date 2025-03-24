-- Create private_conversations table
CREATE TABLE IF NOT EXISTS public.private_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create private_conversation_participants table
CREATE TABLE IF NOT EXISTS public.private_conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.private_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Create private_messages table
CREATE TABLE IF NOT EXISTS public.private_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.private_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT FALSE
);

-- Add RLS policies
ALTER TABLE public.private_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- Policies for private_conversations
DROP POLICY IF EXISTS "Users can view conversations they are part of" ON public.private_conversations;
CREATE POLICY "Users can view conversations they are part of"
  ON public.private_conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.private_conversation_participants
      WHERE conversation_id = id AND user_id = auth.uid()
    )
  );

-- Policies for private_conversation_participants
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.private_conversation_participants;
CREATE POLICY "Users can view conversation participants"
  ON public.private_conversation_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.private_conversation_participants
      WHERE conversation_id = conversation_id AND user_id = auth.uid()
    )
  );

-- Policies for private_messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.private_messages;
CREATE POLICY "Users can view messages in their conversations"
  ON public.private_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.private_conversation_participants
      WHERE conversation_id = conversation_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.private_messages;
CREATE POLICY "Users can insert messages in their conversations"
  ON public.private_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.private_conversation_participants
      WHERE conversation_id = conversation_id AND user_id = auth.uid()
    ) AND sender_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.private_messages;
CREATE POLICY "Users can update their own messages"
  ON public.private_messages
  FOR UPDATE
  USING (sender_id = auth.uid());

-- Add function to update conversation last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.private_conversations
  SET updated_at = NOW(), last_message_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update conversation timestamp when a new message is added
DROP TRIGGER IF EXISTS update_conversation_timestamp ON public.private_messages;
CREATE TRIGGER update_conversation_timestamp
AFTER INSERT ON public.private_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_timestamp();

-- Enable realtime for these tables
alter publication supabase_realtime add table private_conversations;
alter publication supabase_realtime add table private_conversation_participants;
alter publication supabase_realtime add table private_messages;
