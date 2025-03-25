-- Create seasonal events table
CREATE TABLE IF NOT EXISTS forum_seasonal_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create seasonal event challenges table
CREATE TABLE IF NOT EXISTS forum_event_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES forum_seasonal_events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  requirement_type TEXT NOT NULL, -- 'threads', 'replies', 'votes', 'exp'
  requirement_count INTEGER NOT NULL,
  badge_id UUID REFERENCES user_badges(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user event participation table
CREATE TABLE IF NOT EXISTS forum_user_event_participation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES forum_seasonal_events(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES forum_event_challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  badge_awarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Add realtime for all tables
alter publication supabase_realtime add table forum_seasonal_events;
alter publication supabase_realtime add table forum_event_challenges;
alter publication supabase_realtime add table forum_user_event_participation;
