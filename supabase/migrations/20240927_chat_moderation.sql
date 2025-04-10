-- Create table for message reports
CREATE TABLE IF NOT EXISTS message_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES private_messages(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES private_conversations(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  additional_info TEXT,
  message_content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_reports_message_id 
ON message_reports(message_id);

CREATE INDEX IF NOT EXISTS idx_message_reports_reporter_id 
ON message_reports(reporter_id);

CREATE INDEX IF NOT EXISTS idx_message_reports_reported_user_id 
ON message_reports(reported_user_id);

CREATE INDEX IF NOT EXISTS idx_message_reports_status 
ON message_reports(status);

-- Enable RLS for message_reports
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for message_reports
CREATE POLICY "Users can view their own reports" 
ON message_reports FOR SELECT 
USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reports" 
ON message_reports FOR INSERT 
TO authenticated 
WITH CHECK (reporter_id = auth.uid());

-- Create policy for admins to view all reports
CREATE POLICY "Admins can view all reports" 
ON message_reports FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Create policy for admins to update reports
CREATE POLICY "Admins can update reports" 
ON message_reports FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Add is_admin field to users table if it doesn't exist
ALTER TABLE IF EXISTS users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create function to log message moderation actions
CREATE OR REPLACE FUNCTION log_message_moderation()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the moderation action
  INSERT INTO moderation_logs (
    user_id,
    action_type,
    target_type,
    target_id,
    details
  ) VALUES (
    auth.uid(),
    CASE
      WHEN NEW.status = 'reviewed' THEN 'review_message'
      WHEN NEW.status = 'dismissed' THEN 'dismiss_report'
      WHEN NEW.status = 'action_taken' THEN 'take_action'
      ELSE 'update_report'
    END,
    'message',
    NEW.message_id,
    jsonb_build_object(
      'report_id', NEW.id,
      'status', NEW.status,
      'action_taken', NEW.action_taken,
      'previous_status', OLD.status
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create moderation_logs table
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for message moderation
DROP TRIGGER IF EXISTS on_message_moderation ON message_reports;
CREATE TRIGGER on_message_moderation
AFTER UPDATE ON message_reports
FOR EACH ROW
WHEN (OLD.status != NEW.status)
EXECUTE FUNCTION log_message_moderation();

-- Create function to automatically censor bad words
CREATE OR REPLACE FUNCTION censor_bad_words()
RETURNS TRIGGER AS $$
DECLARE
  bad_words TEXT[] := ARRAY['anjing', 'bangsat', 'brengsek', 'kampret', 'keparat', 'bajingan', 'memek', 'kontol', 'ngentot', 'jancok', 'cok', 'asu', 'goblok', 'tolol', 'bodoh', 'idiot', 'bego', 'monyet'];
  censored_content TEXT := NEW.content;
  word TEXT;
BEGIN
  -- Skip system messages
  IF NEW.is_system_message THEN
    RETURN NEW;
  END IF;
  
  -- Censor bad words
  FOREACH word IN ARRAY bad_words LOOP
    censored_content := regexp_replace(
      censored_content,
      '\\b' || word || '\\b',
      repeat('*', length(word)),
      'gi'
    );
  END LOOP;
  
  -- Update content if censoring occurred
  IF censored_content != NEW.content THEN
    NEW.content := censored_content;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic censoring
DROP TRIGGER IF EXISTS auto_censor_messages ON private_messages;
CREATE TRIGGER auto_censor_messages
BEFORE INSERT ON private_messages
FOR EACH ROW
EXECUTE FUNCTION censor_bad_words();
