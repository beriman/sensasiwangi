-- Add max_participants column to sambatan table
ALTER TABLE IF EXISTS sambatan ADD COLUMN IF NOT EXISTS max_participants INTEGER;

-- Update existing sambatan records to set max_participants equal to target_quantity
UPDATE sambatan SET max_participants = target_quantity WHERE max_participants IS NULL;

-- Add check constraint to ensure max_participants is greater than or equal to target_quantity
ALTER TABLE sambatan ADD CONSTRAINT check_max_participants_gte_target CHECK (max_participants >= target_quantity);

-- Update create_sambatan_tables function to include max_participants
CREATE OR REPLACE FUNCTION create_sambatan_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if sambatan table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sambatan') THEN
    -- Create sambatan table
    CREATE TABLE public.sambatan (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
      target_quantity INTEGER NOT NULL CHECK (target_quantity >= 2),
      current_quantity INTEGER NOT NULL DEFAULT 1 CHECK (current_quantity >= 0),
      max_participants INTEGER,
      status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'completed', 'cancelled')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      CONSTRAINT check_max_participants_gte_target CHECK (max_participants >= target_quantity)
    );

    -- Create sambatan_participants table
    CREATE TABLE public.sambatan_participants (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      sambatan_id UUID NOT NULL REFERENCES public.sambatan(id) ON DELETE CASCADE,
      participant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
      payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'verified', 'cancelled')) DEFAULT 'pending',
      payment_proof TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(sambatan_id, participant_id)
    );

    -- Create sambatan_comments table
    CREATE TABLE IF NOT EXISTS public.sambatan_comments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      sambatan_id UUID NOT NULL REFERENCES public.sambatan(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Create indexes for better performance
    CREATE INDEX idx_sambatan_initiator_id ON public.sambatan(initiator_id);
    CREATE INDEX idx_sambatan_product_id ON public.sambatan(product_id);
    CREATE INDEX idx_sambatan_status ON public.sambatan(status);
    CREATE INDEX idx_sambatan_participants_sambatan_id ON public.sambatan_participants(sambatan_id);
    CREATE INDEX idx_sambatan_participants_participant_id ON public.sambatan_participants(participant_id);
    CREATE INDEX idx_sambatan_comments_sambatan_id ON public.sambatan_comments(sambatan_id);
    CREATE INDEX idx_sambatan_comments_user_id ON public.sambatan_comments(user_id);

    -- Enable Row Level Security
    ALTER TABLE public.sambatan ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.sambatan_participants ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.sambatan_comments ENABLE ROW LEVEL SECURITY;

    -- Create policies for sambatan table
    CREATE POLICY "Anyone can view sambatan" 
      ON public.sambatan FOR SELECT USING (true);

    CREATE POLICY "Authenticated users can create sambatan" 
      ON public.sambatan FOR INSERT 
      TO authenticated 
      WITH CHECK (true);

    CREATE POLICY "Users can update their own sambatan" 
      ON public.sambatan FOR UPDATE 
      TO authenticated 
      USING (initiator_id = auth.uid());

    CREATE POLICY "Users can delete their own sambatan" 
      ON public.sambatan FOR DELETE 
      TO authenticated 
      USING (initiator_id = auth.uid());

    -- Create policies for sambatan_participants table
    CREATE POLICY "Anyone can view sambatan participants" 
      ON public.sambatan_participants FOR SELECT USING (true);

    CREATE POLICY "Authenticated users can join sambatan" 
      ON public.sambatan_participants FOR INSERT 
      TO authenticated 
      WITH CHECK (participant_id = auth.uid());

    CREATE POLICY "Users can update their own participation" 
      ON public.sambatan_participants FOR UPDATE 
      TO authenticated 
      USING (participant_id = auth.uid());

    CREATE POLICY "Users can delete their own participation" 
      ON public.sambatan_participants FOR DELETE 
      TO authenticated 
      USING (participant_id = auth.uid());

    -- Create policies for sambatan_comments table
    CREATE POLICY "Anyone can view sambatan comments" 
      ON public.sambatan_comments FOR SELECT USING (true);

    CREATE POLICY "Authenticated users can create comments" 
      ON public.sambatan_comments FOR INSERT 
      TO authenticated 
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can update their own comments" 
      ON public.sambatan_comments FOR UPDATE 
      TO authenticated 
      USING (user_id = auth.uid());

    CREATE POLICY "Users can delete their own comments" 
      ON public.sambatan_comments FOR DELETE 
      TO authenticated 
      USING (user_id = auth.uid());
  END IF;
END;
$$;
