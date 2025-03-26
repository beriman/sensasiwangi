-- Function to create sambatan tables if they don't exist
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
      status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'completed', 'cancelled')) DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
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

    -- Add is_sambatan column to marketplace_products if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'marketplace_products' 
                  AND column_name = 'is_sambatan') THEN
      ALTER TABLE public.marketplace_products ADD COLUMN is_sambatan BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add min_participants column to marketplace_products if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'marketplace_products' 
                  AND column_name = 'min_participants') THEN
      ALTER TABLE public.marketplace_products ADD COLUMN min_participants INTEGER;
    END IF;

    -- Add max_participants column to marketplace_products if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'marketplace_products' 
                  AND column_name = 'max_participants') THEN
      ALTER TABLE public.marketplace_products ADD COLUMN max_participants INTEGER;
    END IF;

    -- Create indexes for better performance
    CREATE INDEX idx_sambatan_initiator_id ON public.sambatan(initiator_id);
    CREATE INDEX idx_sambatan_product_id ON public.sambatan(product_id);
    CREATE INDEX idx_sambatan_status ON public.sambatan(status);
    CREATE INDEX idx_sambatan_participants_sambatan_id ON public.sambatan_participants(sambatan_id);
    CREATE INDEX idx_sambatan_participants_participant_id ON public.sambatan_participants(participant_id);

    -- Enable Row Level Security
    ALTER TABLE public.sambatan ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.sambatan_participants ENABLE ROW LEVEL SECURITY;

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

    -- Enable realtime for these tables
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.sambatan;
      ALTER PUBLICATION supabase_realtime ADD TABLE public.sambatan_participants;
    EXCEPTION
      WHEN OTHERS THEN
        NULL; -- Ignore if publication doesn't exist
    END;
  END IF;

  -- Return success
  RETURN;
END;
$$;
