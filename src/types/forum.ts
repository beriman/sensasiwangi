export interface ForumCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ForumTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface ForumPollOption {
  id: string;
  poll_id: string;
  text: string;
  vote_count: number;
  created_at: string;
}

export interface ForumPoll {
  id: string;
  thread_id: string;
  question: string;
  options: ForumPollOption[];
  created_at: string;
  expires_at?: string;
  is_multiple_choice?: boolean;
  user_voted?: boolean;
}

export interface ForumThread {
  id: string;
  title: string;
  content: string;
  user_id: string;
  category_id: string;
  created_at: string;
  updated_at: string;
  is_pinned?: boolean;
  is_featured?: boolean;
  view_count?: number;
  last_activity_at?: string;
  media_urls?: string[];
  tags?: ForumTag[];
  user?: {
    full_name: string;
    avatar_url: string;
    exp: number;
  };
  vote_count?: {
    cendol: number;
    bata: number;
  };
  reply_count?: number;
  is_bookmarked?: boolean;
  is_followed?: boolean;
  is_read?: boolean;
  is_trending?: boolean;
  poll?: ForumPoll;
  reactions?: Record<string, number>;
  user_reactions?: string[];
}

export interface ForumReply {
  id: string;
  content: string;
  user_id: string;
  thread_id: string;
  created_at: string;
  updated_at: string;
  mentioned_user_ids?: string[];
  media_urls?: string[];
  user?: {
    full_name: string;
    avatar_url: string;
    exp: number;
  };
  vote_count?: {
    cendol: number;
    bata: number;
  };
}

export interface ForumVote {
  id: string;
  user_id: string;
  thread_id: string | null;
  reply_id: string | null;
  vote_type: "cendol" | "bata";
  created_at: string;
}

export interface ForumBookmark {
  id: string;
  user_id: string;
  thread_id: string;
  created_at: string;
}

export interface ForumFollow {
  id: string;
  user_id: string;
  thread_id: string;
  created_at: string;
  email_notifications: boolean;
}

export interface ForumNotification {
  id: string;
  user_id: string;
  message: string;
  type: string; // 'reply', 'mention', 'vote', 'level_up', 'sambatan_joined', 'sambatan_status', 'sambatan_payment', etc.
  thread_id?: string;
  reply_id?: string;
  sambatan_id?: string;
  read: boolean;
  created_at: string;
}

export interface ForumMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    full_name: string;
    avatar_url: string;
  };
  recipient?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface ForumBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  requirement_type: "threads" | "replies" | "votes" | "exp";
  requirement_count: number;
  created_at: string;
}

export interface ForumUserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badge?: ForumBadge;
}

export interface ForumReport {
  id: string;
  reporter_id: string;
  thread_id?: string;
  reply_id?: string;
  reason: string;
  status: "pending" | "resolved" | "rejected";
  created_at: string;
  updated_at: string;
}

export type VoteType = "cendol" | "bata";

export interface ForumSearchFilters {
  categoryId?: string;
  tags?: string[];
  userId?: string;
  authorId?: string;
  sortBy?: "newest" | "oldest" | "most_votes" | "most_replies" | "trending";
  timeFrame?: "today" | "week" | "month" | "year" | "all";
  hasReplies?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface ForumStatistics {
  totalThreads: number;
  totalReplies: number;
  totalUsers: number;
  activeUsers: number;
  threadsToday: number;
  repliesToday: number;
  topContributors: Array<{
    user_id: string;
    full_name: string;
    avatar_url: string;
    exp: number;
    thread_count: number;
    reply_count: number;
  }>;
}

export interface ForumSeasonalEvent {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  challenges?: ForumEventChallenge[];
}

export interface ForumEventChallenge {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  requirement_type: "threads" | "replies" | "votes" | "exp";
  requirement_count: number;
  badge_id: string | null;
  created_at: string;
  badge?: {
    badge_name: string;
    badge_description: string;
  };
}

export interface ForumUserEventParticipation {
  id: string;
  user_id: string;
  event_id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  badge_awarded: boolean;
  created_at: string;
  updated_at: string;
  challenge?: ForumEventChallenge;
  event?: ForumSeasonalEvent;
}

export interface ForumReadingHistory {
  id: string;
  user_id: string;
  thread_id: string;
  created_at: string;
  updated_at: string;
}
