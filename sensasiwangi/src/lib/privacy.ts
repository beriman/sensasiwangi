import { supabase } from "../../supabase/supabase";
import {
  ProfileVisibility,
  UserBlock,
  PrivacySettings,
  NotificationPreferences,
} from "../types/privacy";

// Get user's privacy settings
export async function getPrivacySettings(
  userId: string,
): Promise<PrivacySettings> {
  const { data, error } = await supabase
    .from("users")
    .select(
      "profile_visibility, show_marketplace_activity, show_forum_activity",
    )
    .eq("id", userId)
    .single();

  if (error) throw error;

  return {
    profile_visibility:
      (data?.profile_visibility as ProfileVisibility) || "public",
    show_marketplace_activity: data?.show_marketplace_activity ?? true,
    show_forum_activity: data?.show_forum_activity ?? true,
  };
}

// Update user's privacy settings
export async function updatePrivacySettings(
  userId: string,
  settings: Partial<PrivacySettings>,
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update(settings)
    .eq("id", userId);

  if (error) throw error;
}

// Get user's notification preferences
export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from("users")
    .select(
      "notify_forum_replies, notify_new_followers, notify_marketplace_orders, email_forum_replies, email_new_followers, email_marketplace_orders",
    )
    .eq("id", userId)
    .single();

  if (error) throw error;

  return {
    notify_forum_replies: data?.notify_forum_replies ?? true,
    notify_new_followers: data?.notify_new_followers ?? true,
    notify_marketplace_orders: data?.notify_marketplace_orders ?? true,
    email_forum_replies: data?.email_forum_replies ?? false,
    email_new_followers: data?.email_new_followers ?? false,
    email_marketplace_orders: data?.email_marketplace_orders ?? false,
  };
}

// Update user's notification preferences
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>,
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update(preferences)
    .eq("id", userId);

  if (error) throw error;
}

// Block a user
export async function blockUser(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  // Don't allow blocking yourself
  if (blockerId === blockedId) {
    throw new Error("You cannot block yourself");
  }

  const { error } = await supabase.from("user_blocks").insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });

  if (error) {
    // If the error is a duplicate key error, the user is already blocked
    if (error.code === "23505") {
      return; // Already blocked, just return
    }
    throw error;
  }

  // Also unfollow the blocked user if following
  try {
    await supabase.from("user_follows").delete().match({
      follower_id: blockerId,
      following_id: blockedId,
    });
  } catch (error) {
    console.error("Error unfollowing blocked user:", error);
  }
}

// Unblock a user
export async function unblockUser(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  const { error } = await supabase.from("user_blocks").delete().match({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });

  if (error) throw error;
}

// Check if a user is blocked
export async function isUserBlocked(
  blockerId: string,
  blockedId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_blocks")
    .select("id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned - not blocked
      return false;
    }
    throw error;
  }

  return !!data;
}

// Get list of users blocked by a user
export async function getBlockedUsers(userId: string): Promise<UserBlock[]> {
  const { data, error } = await supabase
    .from("user_blocks")
    .select(
      `
      id,
      created_at,
      blocked:blocked_id(id, full_name, username, avatar_url)
      `,
    )
    .eq("blocker_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Format the data
  const blockedUsers = (data || []).map((item) => {
    const blocked = item.blocked as any;
    return {
      id: item.id,
      blocker_id: userId,
      blocked_id: blocked.id,
      blocked_user: {
        id: blocked.id,
        full_name: blocked.full_name,
        username: blocked.username,
        avatar_url: blocked.avatar_url,
      },
      created_at: item.created_at,
    };
  });

  return blockedUsers;
}

// Check if a profile is visible to a user based on privacy settings
export async function isProfileVisibleToUser(
  profileId: string,
  viewerId?: string,
): Promise<boolean> {
  // If no viewer ID, only public profiles are visible
  if (!viewerId) {
    const { data, error } = await supabase
      .from("users")
      .select("profile_visibility")
      .eq("id", profileId)
      .single();

    if (error) throw error;
    return data?.profile_visibility === "public";
  }

  // If viewer is the profile owner, always visible
  if (viewerId === profileId) {
    return true;
  }

  // Check if viewer is blocked by profile owner
  const isBlocked = await isUserBlocked(profileId, viewerId);
  if (isBlocked) {
    return false;
  }

  // Get profile visibility setting
  const { data, error } = await supabase
    .from("users")
    .select("profile_visibility")
    .eq("id", profileId)
    .single();

  if (error) throw error;

  const visibility = data?.profile_visibility as ProfileVisibility;

  // If public, always visible
  if (visibility === "public") {
    return true;
  }

  // If followers_only, check if viewer follows profile owner
  if (visibility === "followers_only") {
    const { data: followData, error: followError } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", viewerId)
      .eq("following_id", profileId)
      .single();

    if (followError && followError.code !== "PGRST116") throw followError;
    return !!followData;
  }

  // If private, not visible
  return false;
}

