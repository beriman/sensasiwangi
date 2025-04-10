export interface PrivateConversation {
  id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  participants?: ConversationParticipant[];
  last_message?: PrivateMessage;
  unread_count?: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  created_at: string;
  last_read_at: string;
  user?: {
    full_name?: string;
    avatar_url?: string;
    username?: string;
  };
}

export interface PrivateMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  sender?: {
    full_name?: string;
    avatar_url?: string;
    username?: string;
  };
}

export interface MessageFormData {
  content: string;
}
