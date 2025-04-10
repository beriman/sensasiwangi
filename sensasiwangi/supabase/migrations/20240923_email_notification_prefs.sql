-- Add email notification preferences columns to users table if they don't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_forum_replies boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_new_followers boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_marketplace_orders boolean DEFAULT false;
