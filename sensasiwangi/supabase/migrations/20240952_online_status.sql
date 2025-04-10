-- Add online status tracking for users

-- Add online_status and last_active columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS online_status boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active timestamp with time zone DEFAULT now();

-- Create function to update last_active timestamp
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_active on user update
DROP TRIGGER IF EXISTS update_user_last_active ON users;
CREATE TRIGGER update_user_last_active
  BEFORE UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.online_status IS DISTINCT FROM NEW.online_status)
  EXECUTE FUNCTION update_last_active();

-- Create function to automatically set users as offline after inactivity
CREATE OR REPLACE FUNCTION set_inactive_users_offline()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET online_status = false
  WHERE online_status = true
  AND last_active < now() - interval '15 minutes';
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run the function every 5 minutes
SELECT cron.schedule(
  'set-inactive-users-offline',
  '*/5 * * * *',
  $$
  SELECT set_inactive_users_offline();
  $$
);
