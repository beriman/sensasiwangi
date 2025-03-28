-- Add expires_at column to sambatan table
ALTER TABLE sambatan ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Update existing sambatan records to have an expiration date (7 days from creation)
UPDATE sambatan 
SET expires_at = created_at + INTERVAL '7 days'
WHERE expires_at IS NULL;

-- Add index for faster queries on expiration
CREATE INDEX IF NOT EXISTS idx_sambatan_expires_at ON sambatan(expires_at);

-- Add function to set default expiration date for new sambatan records
CREATE OR REPLACE FUNCTION set_sambatan_expiration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at := NEW.created_at + INTERVAL '7 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically set expiration date for new sambatan records
DROP TRIGGER IF EXISTS set_sambatan_expiration_trigger ON sambatan;
CREATE TRIGGER set_sambatan_expiration_trigger
BEFORE INSERT ON sambatan
FOR EACH ROW
WHEN (NEW.expires_at IS NULL)
EXECUTE FUNCTION set_sambatan_expiration();
