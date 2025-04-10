-- Tabel untuk tugas Sambatan
CREATE TABLE IF NOT EXISTS sambatan_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES private_conversations(id) ON DELETE CASCADE,
  sambatan_id UUID REFERENCES sambatan(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeks untuk performa query
CREATE INDEX IF NOT EXISTS idx_sambatan_tasks_conversation_id ON sambatan_tasks(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sambatan_tasks_sambatan_id ON sambatan_tasks(sambatan_id);
CREATE INDEX IF NOT EXISTS idx_sambatan_tasks_assignee_id ON sambatan_tasks(assignee_id);

-- Trigger untuk update timestamp
CREATE OR REPLACE FUNCTION update_sambatan_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sambatan_tasks_updated_at
BEFORE UPDATE ON sambatan_tasks
FOR EACH ROW
EXECUTE FUNCTION update_sambatan_tasks_updated_at();

-- RLS Policies
ALTER TABLE sambatan_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their conversations"
ON sambatan_tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM private_conversation_participants
    WHERE conversation_id = sambatan_tasks.conversation_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create tasks in their conversations"
ON sambatan_tasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM private_conversation_participants
    WHERE conversation_id = sambatan_tasks.conversation_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update tasks they created or are assigned to"
ON sambatan_tasks FOR UPDATE
USING (
  created_by = auth.uid() OR assignee_id = auth.uid()
);

CREATE POLICY "Users can delete tasks they created"
ON sambatan_tasks FOR DELETE
USING (
  created_by = auth.uid()
);

-- Trigger untuk mengirim notifikasi saat tugas dibuat atau diperbarui
CREATE OR REPLACE FUNCTION notify_task_changes()
RETURNS TRIGGER AS $$
DECLARE
  task_title TEXT;
  conversation_id UUID;
  assignee_name TEXT;
  creator_name TEXT;
  notification_message TEXT;
BEGIN
  -- Dapatkan judul tugas
  task_title := NEW.title;
  conversation_id := NEW.conversation_id;
  
  -- Dapatkan nama assignee jika ada
  IF NEW.assignee_id IS NOT NULL THEN
    SELECT full_name INTO assignee_name
    FROM users
    WHERE id = NEW.assignee_id;
  END IF;
  
  -- Dapatkan nama creator
  SELECT full_name INTO creator_name
  FROM users
  WHERE id = NEW.created_by;
  
  -- Buat pesan notifikasi berdasarkan operasi
  IF TG_OP = 'INSERT' THEN
    IF NEW.assignee_id IS NOT NULL THEN
      notification_message := creator_name || ' menugaskan "' || task_title || '" kepada ' || assignee_name;
    ELSE
      notification_message := creator_name || ' membuat tugas baru: "' || task_title || '"';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      notification_message := creator_name || ' mengubah status tugas "' || task_title || '" menjadi ' || NEW.status;
    ELSIF OLD.assignee_id != NEW.assignee_id THEN
      IF NEW.assignee_id IS NOT NULL THEN
        notification_message := creator_name || ' menugaskan "' || task_title || '" kepada ' || assignee_name;
      ELSE
        notification_message := creator_name || ' menghapus penugasan untuk "' || task_title || '"';
      END IF;
    END IF;
  END IF;
  
  -- Kirim notifikasi jika ada pesan
  IF notification_message IS NOT NULL THEN
    INSERT INTO chat_notifications (
      user_id,
      conversation_id,
      message,
      type,
      related_id,
      is_read
    )
    SELECT
      p.user_id,
      conversation_id,
      notification_message,
      'task_update',
      NEW.id,
      false
    FROM private_conversation_participants p
    WHERE p.conversation_id = conversation_id
    AND p.user_id != NEW.created_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_task_insert
AFTER INSERT ON sambatan_tasks
FOR EACH ROW
EXECUTE FUNCTION notify_task_changes();

CREATE TRIGGER notify_task_update
AFTER UPDATE ON sambatan_tasks
FOR EACH ROW
EXECUTE FUNCTION notify_task_changes();
