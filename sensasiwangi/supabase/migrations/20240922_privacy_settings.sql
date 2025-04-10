-- Add profile visibility column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_visibility text DEFAULT 'public'::text;

-- Add activity visibility columns to users table if they don't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS show_marketplace_activity boolean DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS show_forum_activity boolean DEFAULT true;

-- Add notification preferences columns to users table if they don't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notify_forum_replies boolean DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notify_new_followers boolean DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notify_marketplace_orders boolean DEFAULT true;

-- Create user_blocks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    blocked_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(blocker_id, blocked_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON public.user_blocks(blocked_id);

-- Enable realtime for user_blocks table
alter publication supabase_realtime add table user_blocks;
