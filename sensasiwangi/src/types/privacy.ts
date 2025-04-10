export type ProfileVisibility = "public" | "followers_only" | "private";

export interface UserBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface PrivacySettings {
  profile_visibility: ProfileVisibility;
  show_marketplace_activity: boolean;
  show_forum_activity: boolean;
}

export interface NotificationPreferences {
  notify_forum_replies: boolean;
  notify_new_followers: boolean;
  notify_marketplace_orders: boolean;
  email_forum_replies: boolean;
  email_new_followers: boolean;
  email_marketplace_orders: boolean;
}
