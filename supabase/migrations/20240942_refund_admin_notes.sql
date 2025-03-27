-- First check if the table exists, if not create it
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketplace_refunds') THEN
    CREATE TABLE IF NOT EXISTS marketplace_refunds (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      transaction_id UUID NOT NULL REFERENCES marketplace_transactions(id) ON DELETE CASCADE,
      dispute_id UUID REFERENCES marketplace_disputes(id) ON DELETE SET NULL,
      amount DECIMAL(10, 2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
      refund_reason TEXT NOT NULL,
      admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      admin_notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );
  ELSE
    -- Add admin_notes column to marketplace_refunds table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'marketplace_refunds' 
                  AND column_name = 'admin_notes') THEN
      ALTER TABLE marketplace_refunds ADD COLUMN admin_notes TEXT;
    END IF;
  END IF;
END $$;

-- Add index on transaction_id for faster lookups
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'marketplace_refunds_transaction_id_idx') THEN
    CREATE INDEX marketplace_refunds_transaction_id_idx ON marketplace_refunds(transaction_id);
  END IF;
END $$;

-- Add index on dispute_id for faster lookups
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'marketplace_refunds_dispute_id_idx') THEN
    CREATE INDEX marketplace_refunds_dispute_id_idx ON marketplace_refunds(dispute_id);
  END IF;
END $$;

-- Enable realtime for marketplace_refunds
alter publication supabase_realtime add table marketplace_refunds;
