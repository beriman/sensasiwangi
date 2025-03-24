-- Create forum_reports table for content reporting
CREATE TABLE IF NOT EXISTS forum_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'resolved', 'rejected'
  priority VARCHAR(20) NOT NULL DEFAULT 'normal', -- 'normal', 'high'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  CHECK (thread_id IS NOT NULL OR reply_id IS NOT NULL) -- Ensure at least one is provided
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_reports_reporter_id ON forum_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_forum_reports_thread_id ON forum_reports(thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_reports_reply_id ON forum_reports(reply_id);
CREATE INDEX IF NOT EXISTS idx_forum_reports_status ON forum_reports(status);

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE forum_reports;
