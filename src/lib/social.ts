import { supabase } from "../../supabase/supabase";
import { FollowStats, UserFollower, UserFollowing } from "@/types/social";

// Follow a user
export async function followUser(
  followerId: string,
  followingId: string,
): Promise<void> {
  // Don't allow following yourself
  if (followerId === followingId) {
    throw new Error("You cannot follow yourself");
  }

  const { error } = await supabase.from("user_follows").insert({
    follower_id: followerId,
    following_id: followingId,
  });

  if (error) {
    // If the error is a duplicate key error, the user is already following
    if (error.code === "23505") {
      return; // Already following, just return
    }
    throw error;
  }
}

// Unfollow a user
export async function unfollowUser(
  followerId: string,
  followingId: string,
): Promise<void> {
  const { error } = await supabase.from("user_follows").delete().match({
    follower_id: followerId,
    following_id: followingId,
  });

  if (error) throw error;
}

// Check if a user is following another user
export async function isFollowing(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned - not following
      return false;
    }
    throw error;
  }

  return !!data;
}

// Get follow statistics for a user
export async function getFollowStats(
  userId: string,
  currentUserId?: string,
): Promise<FollowStats> {
  // Get followers count
  const { count: followersCount, error: followersError } = await supabase
    .from("user_follows")
    .select("id", { count: "exact", head: true })
    .eq("following_id", userId);

  if (followersError) throw followersError;

  // Get following count
  const { count: followingCount, error: followingError } = await supabase
    .from("user_follows")
    .select("id", { count: "exact", head: true })
    .eq("follower_id", userId);

  if (followingError) throw followingError;

  // Check if current user is following this user
  let isFollowingUser = false;
  if (currentUserId && currentUserId !== userId) {
    isFollowingUser = await isFollowing(currentUserId, userId);
  }

  return {
    followers_count: followersCount || 0,
    following_count: followingCount || 0,
    is_following: isFollowingUser,
  };
}

// Get followers of a user
export async function getFollowers(
  userId: string,
  currentUserId?: string,
): Promise<UserFollower[]> {
  // First check if we need to respect privacy settings
  if (currentUserId !== userId) {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("profile_visibility")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    // Check if profile is private or followers_only
    if (userData?.profile_visibility === "private") {
      return [];
    }

    if (userData?.profile_visibility === "followers_only") {
      // Check if current user is following this user
      if (currentUserId) {
        const isViewerFollowing = await isFollowing(currentUserId, userId);
        if (!isViewerFollowing) {
          return [];
        }
      } else {
        return [];
      }
    }

    // Check if current user is blocked by this user
    if (currentUserId) {
      const { data: blockData, error: blockError } = await supabase
        .from("user_blocks")
        .select("id")
        .eq("blocker_id", userId)
        .eq("blocked_id", currentUserId)
        .single();

      if (!blockError && blockData) {
        // Current user is blocked
        return [];
      }
    }
  }

  const { data, error } = await supabase
    .from("user_follows")
    .select(
      `
      id,
      created_at,
      follower:follower_id(id, full_name, username, avatar_url)
      `,
    )
    .eq("following_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Format the data and check if current user is following each follower
  const followers = await Promise.all(
    (data || []).map(async (item) => {
      const follower = item.follower as any;
      let isFollowingThisUser = false;

      if (currentUserId && currentUserId !== follower.id) {
        isFollowingThisUser = await isFollowing(currentUserId, follower.id);
      }

      return {
        id: follower.id,
        full_name: follower.full_name,
        username: follower.username,
        avatar_url: follower.avatar_url,
        created_at: item.created_at,
        is_following: isFollowingThisUser,
      };
    }),
  );

  return followers;
}

// Get users that a user is following
export async function getFollowing(
  userId: string,
  currentUserId?: string,
): Promise<UserFollowing[]> {
  // First check if we need to respect privacy settings
  if (currentUserId !== userId) {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("profile_visibility")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    // Check if profile is private or followers_only
    if (userData?.profile_visibility === "private") {
      return [];
    }

    if (userData?.profile_visibility === "followers_only") {
      // Check if current user is following this user
      if (currentUserId) {
        const isViewerFollowing = await isFollowing(currentUserId, userId);
        if (!isViewerFollowing) {
          return [];
        }
      } else {
        return [];
      }
    }

    // Check if current user is blocked by this user
    if (currentUserId) {
      const { data: blockData, error: blockError } = await supabase
        .from("user_blocks")
        .select("id")
        .eq("blocker_id", userId)
        .eq("blocked_id", currentUserId)
        .single();

      if (!blockError && blockData) {
        // Current user is blocked
        return [];
      }
    }
  }

  const { data, error } = await supabase
    .from("user_follows")
    .select(
      `
      id,
      created_at,
      following:following_id(id, full_name, username, avatar_url)
      `,
    )
    .eq("follower_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Format the data
  const following = (data || []).map((item) => {
    const followingUser = item.following as any;
    return {
      id: followingUser.id,
      full_name: followingUser.full_name,
      username: followingUser.username,
      avatar_url: followingUser.avatar_url,
      created_at: item.created_at,
    };
  });

  return following;
}
