-- Migration for thread subscriptions and customizable notifications

-- Create table for thread subscriptions
CREATE TABLE IF NOT EXISTS forum_thread_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, thread_id)
);

-- Create table for notification preferences
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  new_replies BOOLEAN DEFAULT TRUE,
  mentions BOOLEAN DEFAULT TRUE,
  thread_updates BOOLEAN DEFAULT TRUE,
  votes BOOLEAN DEFAULT TRUE,
  thread_subscriptions BOOLEAN DEFAULT TRUE,
  direct_messages BOOLEAN DEFAULT TRUE,
  system_announcements BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  email_digest_frequency VARCHAR(20) DEFAULT 'daily', -- 'never', 'daily', 'weekly', 'monthly'
  push_notifications BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create table for notification types
CREATE TABLE IF NOT EXISTS notification_types (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type_id VARCHAR(50) NOT NULL REFERENCES notification_types(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default notification types
INSERT INTO notification_types (id, name, description, icon, color)
VALUES
  ('new_reply', 'New Reply', 'Someone replied to your thread', 'message-square', 'blue'),
  ('mention', 'Mention', 'Someone mentioned you in a post', 'at-sign', 'purple'),
  ('thread_update', 'Thread Update', 'A thread you are subscribed to was updated', 'refresh-cw', 'green'),
  ('vote', 'Vote', 'Someone voted on your post', 'thumbs-up', 'amber'),
  ('thread_subscription', 'Thread Subscription', 'Someone subscribed to your thread', 'bell', 'indigo'),
  ('direct_message', 'Direct Message', 'You received a direct message', 'mail', 'pink'),
  ('system_announcement', 'System Announcement', 'System announcement', 'megaphone', 'red')
ON CONFLICT DO NOTHING;

-- Create function to subscribe to a thread
CREATE OR REPLACE FUNCTION subscribe_to_thread(
  user_id_param UUID,
  thread_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if thread exists
  IF NOT EXISTS (
    SELECT 1 FROM forum_threads
    WHERE id = thread_id_param
  ) THEN
    RAISE EXCEPTION 'Thread not found';
  END IF;
  
  -- Insert subscription
  INSERT INTO forum_thread_subscriptions (user_id, thread_id)
  VALUES (user_id_param, thread_id_param)
  ON CONFLICT (user_id, thread_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to unsubscribe from a thread
CREATE OR REPLACE FUNCTION unsubscribe_from_thread(
  user_id_param UUID,
  thread_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Delete subscription
  DELETE FROM forum_thread_subscriptions
  WHERE user_id = user_id_param AND thread_id = thread_id_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's subscribed threads
CREATE OR REPLACE FUNCTION get_subscribed_threads(
  user_id_param UUID,
  limit_param INTEGER DEFAULT 10,
  offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  user_id UUID,
  category_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  is_pinned BOOLEAN,
  is_solved BOOLEAN,
  view_count INTEGER,
  reply_count INTEGER,
  vote_count INTEGER,
  username TEXT,
  category_name TEXT,
  subscription_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.content,
    t.user_id,
    t.category_id,
    t.created_at,
    t.updated_at,
    t.is_pinned,
    t.is_solved,
    t.view_count,
    t.reply_count,
    t.vote_count,
    u.username,
    c.name AS category_name,
    s.created_at AS subscription_date
  FROM forum_thread_subscriptions s
  JOIN forum_threads t ON s.thread_id = t.id
  JOIN users u ON t.user_id = u.id
  JOIN forum_categories c ON t.category_id = c.id
  WHERE s.user_id = user_id_param
  ORDER BY t.updated_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user is subscribed to a thread
CREATE OR REPLACE FUNCTION is_subscribed_to_thread(
  user_id_param UUID,
  thread_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  is_subscribed BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM forum_thread_subscriptions
    WHERE user_id = user_id_param AND thread_id = thread_id_param
  ) INTO is_subscribed;
  
  RETURN is_subscribed;
END;
$$ LANGUAGE plpgsql;

-- Create function to update notification preferences
CREATE OR REPLACE FUNCTION update_notification_preferences(
  user_id_param UUID,
  new_replies_param BOOLEAN DEFAULT NULL,
  mentions_param BOOLEAN DEFAULT NULL,
  thread_updates_param BOOLEAN DEFAULT NULL,
  votes_param BOOLEAN DEFAULT NULL,
  thread_subscriptions_param BOOLEAN DEFAULT NULL,
  direct_messages_param BOOLEAN DEFAULT NULL,
  system_announcements_param BOOLEAN DEFAULT NULL,
  marketing_emails_param BOOLEAN DEFAULT NULL,
  email_digest_frequency_param VARCHAR DEFAULT NULL,
  push_notifications_param BOOLEAN DEFAULT NULL,
  email_notifications_param BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Insert or update notification preferences
  INSERT INTO user_notification_preferences (
    user_id,
    new_replies,
    mentions,
    thread_updates,
    votes,
    thread_subscriptions,
    direct_messages,
    system_announcements,
    marketing_emails,
    email_digest_frequency,
    push_notifications,
    email_notifications
  )
  VALUES (
    user_id_param,
    COALESCE(new_replies_param, TRUE),
    COALESCE(mentions_param, TRUE),
    COALESCE(thread_updates_param, TRUE),
    COALESCE(votes_param, TRUE),
    COALESCE(thread_subscriptions_param, TRUE),
    COALESCE(direct_messages_param, TRUE),
    COALESCE(system_announcements_param, TRUE),
    COALESCE(marketing_emails_param, FALSE),
    COALESCE(email_digest_frequency_param, 'daily'),
    COALESCE(push_notifications_param, TRUE),
    COALESCE(email_notifications_param, TRUE)
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    new_replies = COALESCE(new_replies_param, user_notification_preferences.new_replies),
    mentions = COALESCE(mentions_param, user_notification_preferences.mentions),
    thread_updates = COALESCE(thread_updates_param, user_notification_preferences.thread_updates),
    votes = COALESCE(votes_param, user_notification_preferences.votes),
    thread_subscriptions = COALESCE(thread_subscriptions_param, user_notification_preferences.thread_subscriptions),
    direct_messages = COALESCE(direct_messages_param, user_notification_preferences.direct_messages),
    system_announcements = COALESCE(system_announcements_param, user_notification_preferences.system_announcements),
    marketing_emails = COALESCE(marketing_emails_param, user_notification_preferences.marketing_emails),
    email_digest_frequency = COALESCE(email_digest_frequency_param, user_notification_preferences.email_digest_frequency),
    push_notifications = COALESCE(push_notifications_param, user_notification_preferences.push_notifications),
    email_notifications = COALESCE(email_notifications_param, user_notification_preferences.email_notifications),
    updated_at = NOW();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get notification preferences
CREATE OR REPLACE FUNCTION get_notification_preferences(
  user_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  preferences JSON;
BEGIN
  -- Get notification preferences
  SELECT json_build_object(
    'new_replies', COALESCE(new_replies, TRUE),
    'mentions', COALESCE(mentions, TRUE),
    'thread_updates', COALESCE(thread_updates, TRUE),
    'votes', COALESCE(votes, TRUE),
    'thread_subscriptions', COALESCE(thread_subscriptions, TRUE),
    'direct_messages', COALESCE(direct_messages, TRUE),
    'system_announcements', COALESCE(system_announcements, TRUE),
    'marketing_emails', COALESCE(marketing_emails, FALSE),
    'email_digest_frequency', COALESCE(email_digest_frequency, 'daily'),
    'push_notifications', COALESCE(push_notifications, TRUE),
    'email_notifications', COALESCE(email_notifications, TRUE)
  )
  INTO preferences
  FROM user_notification_preferences
  WHERE user_id = user_id_param;
  
  -- If no preferences found, return default values
  IF preferences IS NULL THEN
    preferences := json_build_object(
      'new_replies', TRUE,
      'mentions', TRUE,
      'thread_updates', TRUE,
      'votes', TRUE,
      'thread_subscriptions', TRUE,
      'direct_messages', TRUE,
      'system_announcements', TRUE,
      'marketing_emails', FALSE,
      'email_digest_frequency', 'daily',
      'push_notifications', TRUE,
      'email_notifications', TRUE
    );
  END IF;
  
  RETURN preferences;
END;
$$ LANGUAGE plpgsql;

-- Create function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  user_id_param UUID,
  type_id_param VARCHAR(50),
  title_param VARCHAR(255),
  content_param TEXT DEFAULT NULL,
  link_param VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  user_preferences RECORD;
BEGIN
  -- Check if notification type exists
  IF NOT EXISTS (
    SELECT 1 FROM notification_types
    WHERE id = type_id_param
  ) THEN
    RAISE EXCEPTION 'Invalid notification type';
  END IF;
  
  -- Get user notification preferences
  SELECT * INTO user_preferences
  FROM user_notification_preferences
  WHERE user_id = user_id_param;
  
  -- Check if user wants to receive this type of notification
  IF user_preferences IS NOT NULL THEN
    CASE type_id_param
      WHEN 'new_reply' THEN
        IF NOT user_preferences.new_replies THEN
          RETURN NULL;
        END IF;
      WHEN 'mention' THEN
        IF NOT user_preferences.mentions THEN
          RETURN NULL;
        END IF;
      WHEN 'thread_update' THEN
        IF NOT user_preferences.thread_updates THEN
          RETURN NULL;
        END IF;
      WHEN 'vote' THEN
        IF NOT user_preferences.votes THEN
          RETURN NULL;
        END IF;
      WHEN 'thread_subscription' THEN
        IF NOT user_preferences.thread_subscriptions THEN
          RETURN NULL;
        END IF;
      WHEN 'direct_message' THEN
        IF NOT user_preferences.direct_messages THEN
          RETURN NULL;
        END IF;
      WHEN 'system_announcement' THEN
        IF NOT user_preferences.system_announcements THEN
          RETURN NULL;
        END IF;
      ELSE
        -- For unknown types, create notification anyway
    END CASE;
  END IF;
  
  -- Create notification
  INSERT INTO notifications (
    user_id,
    type_id,
    title,
    content,
    link
  )
  VALUES (
    user_id_param,
    type_id_param,
    title_param,
    content_param,
    link_param
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_as_read(
  notification_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update notification
  UPDATE notifications
  SET is_read = TRUE, updated_at = NOW()
  WHERE id = notification_id_param AND user_id = user_id_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(
  user_id_param UUID
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update notifications
  WITH updated AS (
    UPDATE notifications
    SET is_read = TRUE, updated_at = NOW()
    WHERE user_id = user_id_param AND is_read = FALSE
    RETURNING id
  )
  SELECT COUNT(*) INTO updated_count FROM updated;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's notifications
CREATE OR REPLACE FUNCTION get_user_notifications(
  user_id_param UUID,
  limit_param INTEGER DEFAULT 10,
  offset_param INTEGER DEFAULT 0,
  unread_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  type_id VARCHAR(50),
  type_name VARCHAR(100),
  type_icon VARCHAR(50),
  type_color VARCHAR(50),
  title VARCHAR(255),
  content TEXT,
  link VARCHAR(255),
  is_read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.type_id,
    t.name AS type_name,
    t.icon AS type_icon,
    t.color AS type_color,
    n.title,
    n.content,
    n.link,
    n.is_read,
    n.created_at,
    n.updated_at
  FROM notifications n
  JOIN notification_types t ON n.type_id = t.id
  WHERE n.user_id = user_id_param
  AND (NOT unread_only OR n.is_read = FALSE)
  ORDER BY n.created_at DESC
  LIMIT limit_param
  OFFSET offset_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(
  user_id_param UUID
)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM notifications
  WHERE user_id = user_id_param AND is_read = FALSE;
  
  RETURN count;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to notify subscribers when a thread is updated
CREATE OR REPLACE FUNCTION notify_thread_subscribers()
RETURNS TRIGGER AS $$
DECLARE
  subscriber_record RECORD;
  thread_title TEXT;
BEGIN
  -- Get thread title
  SELECT title INTO thread_title
  FROM forum_threads
  WHERE id = NEW.thread_id;
  
  -- Notify subscribers
  FOR subscriber_record IN
    SELECT user_id
    FROM forum_thread_subscriptions
    WHERE thread_id = NEW.thread_id
    AND user_id != NEW.user_id -- Don't notify the user who made the reply
  LOOP
    PERFORM create_notification(
      subscriber_record.user_id,
      'thread_update',
      'Thread Updated: ' || thread_title,
      'A thread you are subscribed to has a new reply',
      '/forum/thread/' || NEW.thread_id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on forum_replies
CREATE TRIGGER notify_thread_subscribers_trigger
AFTER INSERT ON forum_replies
FOR EACH ROW
EXECUTE FUNCTION notify_thread_subscribers();

-- Create trigger to notify thread owner when someone subscribes to their thread
CREATE OR REPLACE FUNCTION notify_thread_owner_on_subscription()
RETURNS TRIGGER AS $$
DECLARE
  thread_record RECORD;
  subscriber_username TEXT;
BEGIN
  -- Get thread info
  SELECT t.*, u.username INTO thread_record
  FROM forum_threads t
  JOIN users u ON t.user_id = u.id
  WHERE t.id = NEW.thread_id;
  
  -- Get subscriber username
  SELECT username INTO subscriber_username
  FROM users
  WHERE id = NEW.user_id;
  
  -- Don't notify if the thread owner subscribes to their own thread
  IF thread_record.user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Notify thread owner
  PERFORM create_notification(
    thread_record.user_id,
    'thread_subscription',
    'New Subscriber: ' || subscriber_username,
    subscriber_username || ' subscribed to your thread: ' || thread_record.title,
    '/forum/thread/' || NEW.thread_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on forum_thread_subscriptions
CREATE TRIGGER notify_thread_owner_on_subscription_trigger
AFTER INSERT ON forum_thread_subscriptions
FOR EACH ROW
EXECUTE FUNCTION notify_thread_owner_on_subscription();

-- Enable realtime for new tables
ALTER publication supabase_realtime ADD TABLE forum_thread_subscriptions;
ALTER publication supabase_realtime ADD TABLE user_notification_preferences;
ALTER publication supabase_realtime ADD TABLE notification_types;
ALTER publication supabase_realtime ADD TABLE notifications;
