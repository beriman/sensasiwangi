-- Create table for security audit logs
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_id UUID,
  target_type TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type 
ON security_audit_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id 
ON security_audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_severity 
ON security_audit_logs(severity);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at 
ON security_audit_logs(created_at);

-- Enable RLS for security_audit_logs
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for security_audit_logs
CREATE POLICY "Admins can view all security audit logs" 
ON security_audit_logs FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Create table for screenshot logs
CREATE TABLE IF NOT EXISTS screenshot_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES private_conversations(id) ON DELETE CASCADE,
  is_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_screenshot_logs_user_id 
ON screenshot_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_screenshot_logs_conversation_id 
ON screenshot_logs(conversation_id);

-- Enable RLS for screenshot_logs
ALTER TABLE screenshot_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for screenshot_logs
CREATE POLICY "Admins can view all screenshot logs" 
ON screenshot_logs FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Users can create their own screenshot logs" 
ON screenshot_logs FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Create table for malicious link logs
CREATE TABLE IF NOT EXISTS malicious_link_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES private_conversations(id) ON DELETE CASCADE,
  link TEXT NOT NULL,
  link_type TEXT NOT NULL CHECK (link_type IN ('malicious', 'phishing', 'suspicious', 'insecure')),
  is_blocked BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_malicious_link_logs_user_id 
ON malicious_link_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_malicious_link_logs_conversation_id 
ON malicious_link_logs(conversation_id);

CREATE INDEX IF NOT EXISTS idx_malicious_link_logs_link_type 
ON malicious_link_logs(link_type);

-- Enable RLS for malicious_link_logs
ALTER TABLE malicious_link_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for malicious_link_logs
CREATE POLICY "Admins can view all malicious link logs" 
ON malicious_link_logs FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Users can create malicious link logs" 
ON malicious_link_logs FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type TEXT,
  p_user_id UUID,
  p_target_id UUID DEFAULT NULL,
  p_target_type TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'low'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO security_audit_logs (
    event_type,
    user_id,
    target_id,
    target_type,
    ip_address,
    user_agent,
    details,
    severity
  ) VALUES (
    p_event_type,
    p_user_id,
    p_target_id,
    p_target_type,
    p_ip_address,
    p_user_agent,
    p_details,
    p_severity
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Create trigger to log message reports
CREATE OR REPLACE FUNCTION log_message_report()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_security_event(
    'message_reported',
    NEW.reporter_id,
    NEW.message_id,
    'message',
    NULL,
    NULL,
    jsonb_build_object(
      'reason', NEW.reason,
      'conversation_id', NEW.conversation_id,
      'reported_user_id', NEW.reported_user_id
    ),
    'medium'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_report ON message_reports;
CREATE TRIGGER on_message_report
AFTER INSERT ON message_reports
FOR EACH ROW
EXECUTE FUNCTION log_message_report();

-- Create trigger to log user blocks
CREATE OR REPLACE FUNCTION log_user_block()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_security_event(
    'user_blocked',
    NEW.blocker_id,
    NEW.blocked_id,
    'user',
    NULL,
    NULL,
    jsonb_build_object(
      'reason', NEW.reason
    ),
    'medium'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_block ON user_blocks;
CREATE TRIGGER on_user_block
AFTER INSERT ON user_blocks
FOR EACH ROW
EXECUTE FUNCTION log_user_block();

-- Create trigger to log message deletions
CREATE OR REPLACE FUNCTION log_message_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
    PERFORM log_security_event(
      'message_deleted',
      auth.uid(),
      NEW.id,
      'message',
      NULL,
      NULL,
      jsonb_build_object(
        'conversation_id', NEW.conversation_id,
        'sender_id', NEW.sender_id,
        'is_system_action', NEW.deleted_at IS NOT NULL
      ),
      'low'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_deletion ON private_messages;
CREATE TRIGGER on_message_deletion
AFTER UPDATE OF is_deleted ON private_messages
FOR EACH ROW
EXECUTE FUNCTION log_message_deletion();

-- Create trigger to log encryption events
CREATE OR REPLACE FUNCTION log_encryption_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_encrypted = true AND (OLD.is_encrypted IS NULL OR OLD.is_encrypted = false) THEN
    PERFORM log_security_event(
      'encryption_enabled',
      NEW.sender_id,
      NEW.id,
      'message',
      NULL,
      NULL,
      jsonb_build_object(
        'conversation_id', NEW.conversation_id
      ),
      'medium'
    );
  ELSIF NEW.is_encrypted = false AND OLD.is_encrypted = true THEN
    PERFORM log_security_event(
      'encryption_disabled',
      NEW.sender_id,
      NEW.id,
      'message',
      NULL,
      NULL,
      jsonb_build_object(
        'conversation_id', NEW.conversation_id
      ),
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_encryption_change ON private_messages;
CREATE TRIGGER on_encryption_change
AFTER UPDATE OF is_encrypted ON private_messages
FOR EACH ROW
EXECUTE FUNCTION log_encryption_event();

-- Create function to check for suspicious activity
CREATE OR REPLACE FUNCTION check_suspicious_activity()
RETURNS TRIGGER AS $$
DECLARE
  login_failures INT;
  recent_reports INT;
BEGIN
  -- Check for multiple login failures
  SELECT COUNT(*) INTO login_failures
  FROM security_audit_logs
  WHERE event_type = 'login_failure'
  AND user_id = NEW.user_id
  AND created_at > NOW() - INTERVAL '1 hour';
  
  IF login_failures >= 5 THEN
    PERFORM log_security_event(
      'suspicious_login_activity',
      NEW.user_id,
      NULL,
      NULL,
      NEW.ip_address,
      NEW.user_agent,
      jsonb_build_object(
        'login_failures', login_failures,
        'time_window', '1 hour'
      ),
      'high'
    );
  END IF;
  
  -- Check for multiple message reports
  SELECT COUNT(*) INTO recent_reports
  FROM message_reports
  WHERE reported_user_id = NEW.user_id
  AND created_at > NOW() - INTERVAL '24 hours';
  
  IF recent_reports >= 3 THEN
    PERFORM log_security_event(
      'multiple_reports_received',
      NEW.user_id,
      NULL,
      NULL,
      NULL,
      NULL,
      jsonb_build_object(
        'report_count', recent_reports,
        'time_window', '24 hours'
      ),
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
