-- Add mentioned_user_ids column to forum_replies table
ALTER TABLE public.forum_replies
ADD COLUMN IF NOT EXISTS mentioned_user_ids UUID[] DEFAULT '{}'::UUID[];

-- Add username column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'username') THEN
    ALTER TABLE public.users ADD COLUMN username TEXT UNIQUE;
    
    -- Set default usernames based on email for existing users
    UPDATE public.users 
    SET username = SPLIT_PART(email, '@', 1) 
    WHERE username IS NULL AND email IS NOT NULL;
  END IF;
END $$;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users (username);

-- Enable realtime for the users table
alter publication supabase_realtime add table users;
