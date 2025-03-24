import { supabase } from "../../supabase/supabase";
import {
  ForumCategory,
  ForumThread,
  ForumReply,
  VoteType,
  ForumTag,
  ForumNotification,
  ForumSearchFilters,
  ForumStatistics,
  ForumBadge,
  ForumUserBadge,
  ForumMessage,
} from "@/types/forum";

// Experience points constants
const EXP_CREATE_THREAD = 1;
const EXP_RECEIVE_CENDOL = 5;
const EXP_RECEIVE_BATA = -3;

// Reputation levels with privileges
export const REPUTATION_LEVELS = [
  {
    level: 1,
    exp: 0,
    title: "Newbie",
    description: "Just starting your perfume journey",
    privileges: ["Create threads and replies", "Vote on threads and replies"],
  },
  {
    level: 2,
    exp: 100,
    title: "Apprentice",
    description: "Learning the basics of perfumery",
    privileges: ["Create custom tags", "Upload images in posts"],
  },
  {
    level: 3,
    exp: 300,
    title: "Enthusiast",
    description: "Developing your perfume palette",
    privileges: [
      "Edit posts up to 24 hours after posting",
      "Create polls in threads",
    ],
  },
  {
    level: 4,
    exp: 600,
    title: "Expert",
    description: "Recognized for your perfume knowledge",
    privileges: [
      "Suggest thread edits to moderators",
      "Highlight your best reviews",
    ],
  },
  {
    level: 5,
    exp: 1000,
    title: "Master",
    description: "A respected voice in the community",
    privileges: [
      "Flag inappropriate content for immediate review",
      "Create featured content",
    ],
  },
  {
    level: 6,
    exp: 1500,
    title: "Grandmaster",
    description: "Elite perfume connoisseur",
    privileges: ["Help moderate forum content", "Create community challenges"],
  },
  {
    level: 7,
    exp: 2500,
    title: "Perfume Sage",
    description: "Legendary status in the community",
    privileges: [
      "Posts appear highlighted in threads",
      "Create special community events",
    ],
  },
];

// Get all forum categories
export async function getForumCategories(): Promise<ForumCategory[]> {
  const { data, error } = await supabase
    .from("forum_categories")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Get all forum tags
export async function getForumTags(): Promise<ForumTag[]> {
  const { data, error } = await supabase
    .from("forum_tags")
    .select(
      "*, usage_count:forum_thread_tags!forum_thread_tags_tag_id_fkey(count)",
    )
    .order("name", { ascending: true });

  if (error) throw error;

  // Process the usage count from the aggregation
  return (data || []).map((tag) => ({
    ...tag,
    usage_count: tag.usage_count?.length || 0,
  }));
}

// Create a custom tag
export async function createCustomTag(tagData: {
  name: string;
  color: string;
  description?: string;
  category?: string;
  user_id: string;
}): Promise<ForumTag> {
  const { data, error } = await supabase
    .from("forum_tags")
    .insert({
      name: tagData.name,
      color: tagData.color,
      description: tagData.description || null,
      category: tagData.category || "Custom",
      user_id: tagData.user_id,
      is_custom: true,
    })
    .select()
    .single();

  if (error) throw error;
  return { ...data, usage_count: 0 };
}

// Search threads with filters
export async function searchThreads(
  searchTerm: string,
  filters: ForumSearchFilters = {},
): Promise<ForumThread[]> {
  let query = supabase.from("forum_threads").select(
    `
      *,
      user:users(full_name, avatar_url, exp)
    `,
  );

  // Apply search term if provided
  if (searchTerm) {
    query = query.or(
      `title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`,
    );
  }

  // Apply category filter
  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  // Apply user filter
  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }

  // Apply time frame filter
  if (filters.timeFrame && filters.timeFrame !== "all") {
    const now = new Date();
    let startDate = new Date();

    switch (filters.timeFrame) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    query = query.gte("created_at", startDate.toISOString());
  }

  // Apply sorting
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "trending":
        query = query.order("last_activity_at", { ascending: false });
        break;
      // For most_votes and most_replies, we'll need to handle these after fetching
      default:
        query = query.order("created_at", { ascending: false });
    }
  } else {
    // Default sort by newest
    query = query.order("created_at", { ascending: false });
  }

  // Execute query
  const { data, error } = await query;

  if (error) throw error;

  // Get additional data for each thread
  const threadsWithData = await Promise.all(
    (data || []).map(async (thread) => {
      // Get vote counts
      const { data: cendolCount } = await supabase
        .from("forum_votes")
        .select("id", { count: "exact" })
        .eq("thread_id", thread.id)
        .eq("vote_type", "cendol");

      const { data: bataCount } = await supabase
        .from("forum_votes")
        .select("id", { count: "exact" })
        .eq("thread_id", thread.id)
        .eq("vote_type", "bata");

      // Get reply count
      const { data: replyCount } = await supabase
        .from("forum_replies")
        .select("id", { count: "exact" })
        .eq("thread_id", thread.id);

      // Get tags if thread has any
      const { data: threadTags } = await supabase
        .from("forum_thread_tags")
        .select("tag:tag_id(*)")
        .eq("thread_id", thread.id);

      const tags = threadTags?.map((tt) => tt.tag) || [];

      return {
        ...thread,
        vote_count: {
          cendol: cendolCount?.length || 0,
          bata: bataCount?.length || 0,
        },
        reply_count: replyCount?.length || 0,
        tags,
      };
    }),
  );

  // Apply post-fetch sorting if needed
  if (filters.sortBy === "most_votes") {
    threadsWithData.sort((a, b) => {
      const aVotes = (a.vote_count?.cendol || 0) - (a.vote_count?.bata || 0);
      const bVotes = (b.vote_count?.cendol || 0) - (b.vote_count?.bata || 0);
      return bVotes - aVotes;
    });
  } else if (filters.sortBy === "most_replies") {
    threadsWithData.sort((a, b) => {
      return (b.reply_count || 0) - (a.reply_count || 0);
    });
  }

  // Apply tag filtering if needed
  if (filters.tags && filters.tags.length > 0) {
    return threadsWithData.filter((thread) => {
      if (!thread.tags || thread.tags.length === 0) return false;
      return thread.tags.some((tag: ForumTag) =>
        filters.tags!.includes(tag.id),
      );
    });
  }

  return threadsWithData;
}

// Get forum statistics
export async function getForumStatistics(): Promise<ForumStatistics> {
  // Get total threads count
  const { count: totalThreads, error: threadsError } = await supabase
    .from("forum_threads")
    .select("*", { count: "exact", head: true });

  // Get total replies count
  const { count: totalReplies, error: repliesError } = await supabase
    .from("forum_replies")
    .select("*", { count: "exact", head: true });

  // Get total users count
  const { count: totalUsers, error: usersError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  // Get active users (posted in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: activeUsers, error: activeUsersError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .or(
      `updated_at.gte.${thirtyDaysAgo.toISOString()},created_at.gte.${thirtyDaysAgo.toISOString()}`,
    );

  // Get threads and replies created today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: threadsToday, error: threadsTodayError } = await supabase
    .from("forum_threads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString());

  const { count: repliesToday, error: repliesTodayError } = await supabase
    .from("forum_replies")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString());

  // Get top contributors
  const { data: topContributors, error: contributorsError } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, exp_points, level")
    .order("exp_points", { ascending: false })
    .limit(5);

  // For each top contributor, get their thread and reply counts
  const topContributorsWithCounts = await Promise.all(
    (topContributors || []).map(async (user) => {
      const { count: threadCount } = await supabase
        .from("forum_threads")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: replyCount } = await supabase
        .from("forum_replies")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      return {
        user_id: user.id,
        full_name: user.full_name || "User",
        avatar_url: user.avatar_url,
        exp: user.exp_points || 0,
        thread_count: threadCount || 0,
        reply_count: replyCount || 0,
      };
    }),
  );

  return {
    totalThreads: totalThreads || 0,
    totalReplies: totalReplies || 0,
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    threadsToday: threadsToday || 0,
    repliesToday: repliesToday || 0,
    topContributors: topContributorsWithCounts,
  };
}

// Get threads by category
export async function getThreadsByCategory(
  categoryId: string,
): Promise<ForumThread[]> {
  const { data, error } = await supabase
    .from("forum_threads")
    .select(
      `
      *,
      user:users(full_name, avatar_url, exp)
    `,
    )
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Get vote counts for each thread
  const threadsWithVotes = await Promise.all(
    (data || []).map(async (thread) => {
      const { data: cendolCount } = await supabase
        .from("forum_votes")
        .select("id", { count: "exact" })
        .eq("thread_id", thread.id)
        .eq("vote_type", "cendol");

      const { data: bataCount } = await supabase
        .from("forum_votes")
        .select("id", { count: "exact" })
        .eq("thread_id", thread.id)
        .eq("vote_type", "bata");

      const { data: replyCount } = await supabase
        .from("forum_replies")
        .select("id", { count: "exact" })
        .eq("thread_id", thread.id);

      return {
        ...thread,
        vote_count: {
          cendol: cendolCount?.length || 0,
          bata: bataCount?.length || 0,
        },
        reply_count: replyCount?.length || 0,
      };
    }),
  );

  return threadsWithVotes;
}

// Get a single thread with its replies
export async function getThread(threadId: string): Promise<{
  thread: ForumThread;
  replies: ForumReply[];
}> {
  // Get thread
  const { data: thread, error: threadError } = await supabase
    .from("forum_threads")
    .select(
      `
      *,
      user:users(full_name, avatar_url, exp)
    `,
    )
    .eq("id", threadId)
    .single();

  if (threadError) throw threadError;

  // Get thread votes
  const { data: cendolCount } = await supabase
    .from("forum_votes")
    .select("id", { count: "exact" })
    .eq("thread_id", threadId)
    .eq("vote_type", "cendol");

  const { data: bataCount } = await supabase
    .from("forum_votes")
    .select("id", { count: "exact" })
    .eq("thread_id", threadId)
    .eq("vote_type", "bata");

  const threadWithVotes = {
    ...thread,
    vote_count: {
      cendol: cendolCount?.length || 0,
      bata: bataCount?.length || 0,
    },
  };

  // Get replies
  const { data: replies, error: repliesError } = await supabase
    .from("forum_replies")
    .select(
      `
      *,
      user:users(full_name, avatar_url, exp)
    `,
    )
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (repliesError) throw repliesError;

  // Get vote counts for each reply
  const repliesWithVotes = await Promise.all(
    (replies || []).map(async (reply) => {
      const { data: replyCendolCount } = await supabase
        .from("forum_votes")
        .select("id", { count: "exact" })
        .eq("reply_id", reply.id)
        .eq("vote_type", "cendol");

      const { data: replyBataCount } = await supabase
        .from("forum_votes")
        .select("id", { count: "exact" })
        .eq("reply_id", reply.id)
        .eq("vote_type", "bata");

      return {
        ...reply,
        vote_count: {
          cendol: replyCendolCount?.length || 0,
          bata: replyBataCount?.length || 0,
        },
      };
    }),
  );

  return {
    thread: threadWithVotes,
    replies: repliesWithVotes || [],
  };
}

// Create a new thread
export async function createThread(
  title: string,
  content: string,
  categoryId: string,
  userId: string,
  tagIds?: string[],
): Promise<{
  thread: ForumThread;
  levelUp?: { newLevel: number; oldLevel: number };
}> {
  // Insert thread
  const { data, error } = await supabase
    .from("forum_threads")
    .insert({
      title,
      content,
      category_id: categoryId,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;

  // Add tags if provided
  if (tagIds && tagIds.length > 0 && data) {
    const threadTags = tagIds.map((tagId) => ({
      thread_id: data.id,
      tag_id: tagId,
    }));

    const { error: tagError } = await supabase
      .from("forum_thread_tags")
      .insert(threadTags);

    if (tagError) {
      console.error("Error adding tags to thread:", tagError);
      // Continue execution even if tag insertion fails
    }
  }

  // Update user EXP
  const expResult = await updateUserExp(userId, EXP_CREATE_THREAD);

  // Get user name for mention notifications
  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", userId)
    .single();

  const userName = userData?.full_name || "Seseorang";

  // Check for mentions in the content
  await createMentionNotification(content, userId, userName, data.id);

  // Create level up notification if applicable
  if (expResult.leveledUp) {
    await createLevelUpNotification(
      userId,
      expResult.newLevel!,
      expResult.oldLevel!,
    );
  }

  return {
    thread: data,
    levelUp: expResult.leveledUp
      ? { newLevel: expResult.newLevel!, oldLevel: expResult.oldLevel! }
      : undefined,
  };
}

// Update an existing thread
export async function updateThread(
  threadId: string,
  title: string,
  content: string,
  categoryId: string,
  userId: string,
  tagIds?: string[],
): Promise<ForumThread> {
  // First check if user is the author of the thread
  const { data: threadData, error: threadError } = await supabase
    .from("forum_threads")
    .select("user_id")
    .eq("id", threadId)
    .single();

  if (threadError) throw threadError;

  if (threadData.user_id !== userId) {
    throw new Error("Unauthorized: You can only edit your own threads");
  }

  // Update thread
  const { data, error } = await supabase
    .from("forum_threads")
    .update({
      title,
      content,
      category_id: categoryId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId)
    .select()
    .single();

  if (error) throw error;

  // Handle tags if provided
  if (tagIds) {
    // First remove all existing tags
    await supabase.from("forum_thread_tags").delete().eq("thread_id", threadId);

    // Then add new tags if any
    if (tagIds.length > 0) {
      const threadTags = tagIds.map((tagId) => ({
        thread_id: threadId,
        tag_id: tagId,
      }));

      const { error: tagError } = await supabase
        .from("forum_thread_tags")
        .insert(threadTags);

      if (tagError) {
        console.error("Error updating tags for thread:", tagError);
        // Continue execution even if tag insertion fails
      }
    }
  }

  // Get user name for mention notifications
  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", userId)
    .single();

  const userName = userData?.full_name || "Seseorang";

  // Check for new mentions in the content
  await createMentionNotification(content, userId, userName, threadId);

  return data;
}

// Create a reply to a thread
export async function createReply(
  content: string,
  threadId: string,
  userId: string,
): Promise<ForumReply> {
  const { data, error } = await supabase
    .from("forum_replies")
    .insert({
      content,
      thread_id: threadId,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;

  // Get user name for notification
  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", userId)
    .single();

  const userName = userData?.full_name || "Seseorang";

  // Create notification for thread author
  await createReplyNotification(threadId, data.id, userName);

  // Check for mentions in the content
  await createMentionNotification(content, userId, userName, threadId, data.id);

  return data;
}

// Update a reply
export async function updateReply(
  replyId: string,
  content: string,
  userId: string,
): Promise<ForumReply> {
  // First check if user is the author of the reply
  const { data: replyData, error: replyError } = await supabase
    .from("forum_replies")
    .select("user_id, thread_id")
    .eq("id", replyId)
    .single();

  if (replyError) throw replyError;

  if (replyData.user_id !== userId) {
    throw new Error("Unauthorized: You can only edit your own replies");
  }

  // Update reply
  const { data, error } = await supabase
    .from("forum_replies")
    .update({
      content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", replyId)
    .select()
    .single();

  if (error) throw error;

  // Get user name for mention notifications
  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", userId)
    .single();

  const userName = userData?.full_name || "Seseorang";

  // Check for new mentions in the content
  await createMentionNotification(
    content,
    userId,
    userName,
    replyData.thread_id,
    replyId,
  );

  return data;
}

// Delete a reply
export async function deleteReply(
  replyId: string,
  userId: string,
): Promise<void> {
  // First check if user is the author of the reply
  const { data: replyData, error: replyError } = await supabase
    .from("forum_replies")
    .select("user_id")
    .eq("id", replyId)
    .single();

  if (replyError) throw replyError;

  if (replyData.user_id !== userId) {
    throw new Error("Unauthorized: You can only delete your own replies");
  }

  // Delete votes on the reply
  await supabase.from("forum_votes").delete().eq("reply_id", replyId);

  // Delete notifications related to the reply
  await supabase.from("forum_notifications").delete().eq("reply_id", replyId);

  // Delete the reply
  const { error } = await supabase
    .from("forum_replies")
    .delete()
    .eq("id", replyId);

  if (error) throw error;
}

// Vote on a thread or reply
export async function vote(
  userId: string,
  voteType: VoteType,
  threadId?: string,
  replyId?: string,
): Promise<{
  levelUp?: { newLevel: number; oldLevel: number; userId: string };
}> {
  // Check if user has already voted
  const { data: existingVote } = await supabase
    .from("forum_votes")
    .select("*")
    .match(
      threadId
        ? { user_id: userId, thread_id: threadId }
        : { user_id: userId, reply_id: replyId },
    )
    .single();

  // Get voter name for notification
  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", userId)
    .single();

  const voterName = userData?.full_name || "Seseorang";

  // If vote exists and is the same type, remove it (toggle off)
  if (existingVote && existingVote.vote_type === voteType) {
    await supabase.from("forum_votes").delete().match({ id: existingVote.id });

    // Reverse the EXP change
    const targetUserId = threadId
      ? await getThreadAuthor(threadId)
      : await getReplyAuthor(replyId!);

    if (targetUserId && targetUserId !== userId) {
      // Don't adjust EXP if voting on own content
      const expChange =
        voteType === "cendol" ? -EXP_RECEIVE_CENDOL : -EXP_RECEIVE_BATA;
      await updateUserExp(targetUserId, expChange);
    }
    return { levelUp: undefined };
  }

  // If vote exists but is different type, update it
  if (existingVote) {
    await supabase
      .from("forum_votes")
      .update({ vote_type: voteType })
      .match({ id: existingVote.id });

    // Update EXP based on vote change
    const targetUserId = threadId
      ? await getThreadAuthor(threadId)
      : await getReplyAuthor(replyId!);

    if (targetUserId && targetUserId !== userId) {
      // Don't adjust EXP if voting on own content
      // Reverse previous vote EXP
      const previousExpChange =
        existingVote.vote_type === "cendol"
          ? -EXP_RECEIVE_CENDOL
          : -EXP_RECEIVE_BATA;
      await updateUserExp(targetUserId, previousExpChange);

      // Add new vote EXP
      const newExpChange =
        voteType === "cendol" ? EXP_RECEIVE_CENDOL : EXP_RECEIVE_BATA;
      const expResult = await updateUserExp(targetUserId, newExpChange);

      // Create notification for cendol votes
      if (voteType === "cendol") {
        await createVoteNotification(
          targetUserId,
          voterName,
          voteType,
          threadId,
          replyId,
        );
      }

      if (expResult.leveledUp) {
        // Create level up notification
        await createLevelUpNotification(
          targetUserId,
          expResult.newLevel!,
          expResult.oldLevel!,
        );

        return {
          levelUp: {
            newLevel: expResult.newLevel!,
            oldLevel: expResult.oldLevel!,
            userId: targetUserId,
          },
        };
      }
    }
    return { levelUp: undefined };
  }

  // Otherwise, insert new vote
  await supabase.from("forum_votes").insert({
    user_id: userId,
    thread_id: threadId || null,
    reply_id: replyId || null,
    vote_type: voteType,
  });

  // Update EXP for the content author
  const targetUserId = threadId
    ? await getThreadAuthor(threadId)
    : await getReplyAuthor(replyId!);

  if (targetUserId && targetUserId !== userId) {
    // Don't adjust EXP if voting on own content
    const expChange =
      voteType === "cendol" ? EXP_RECEIVE_CENDOL : EXP_RECEIVE_BATA;
    const expResult = await updateUserExp(targetUserId, expChange);

    // Create notification for cendol votes
    if (voteType === "cendol") {
      await createVoteNotification(
        targetUserId,
        voterName,
        voteType,
        threadId,
        replyId,
      );
    }

    if (expResult.leveledUp) {
      // Create level up notification
      await createLevelUpNotification(
        targetUserId,
        expResult.newLevel!,
        expResult.oldLevel!,
      );

      return {
        levelUp: {
          newLevel: expResult.newLevel!,
          oldLevel: expResult.oldLevel!,
          userId: targetUserId,
        },
      };
    }
  }

  return { levelUp: undefined };
}

// Get user's vote on a thread or reply
export async function getUserVote(
  userId: string,
  threadId?: string,
  replyId?: string,
): Promise<VoteType | null> {
  try {
    const { data, error } = await supabase
      .from("forum_votes")
      .select("vote_type")
      .match(
        threadId
          ? { user_id: userId, thread_id: threadId }
          : { user_id: userId, reply_id: replyId },
      )
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      throw error;
    }

    return data ? (data.vote_type as VoteType) : null;
  } catch (error) {
    console.error("Error getting user vote:", error);
    return null;
  }
}

// Helper function to get thread author
async function getThreadAuthor(threadId: string): Promise<string | null> {
  const { data } = await supabase
    .from("forum_threads")
    .select("user_id")
    .eq("id", threadId)
    .single();

  return data ? data.user_id : null;
}

// Helper function to get reply author
async function getReplyAuthor(replyId: string): Promise<string | null> {
  const { data } = await supabase
    .from("forum_replies")
    .select("user_id")
    .eq("id", replyId)
    .single();

  return data ? data.user_id : null;
}

// Update user experience points
async function updateUserExp(
  userId: string,
  expChange: number,
): Promise<{ leveledUp: boolean; newLevel?: number; oldLevel?: number }> {
  const { data: user } = await supabase
    .from("users")
    .select("exp_points, level")
    .eq("id", userId)
    .single();

  const currentExp = user?.exp_points || 0;
  const currentLevel = user?.level || 1;
  const newExp = Math.max(0, currentExp + expChange); // Prevent negative EXP

  // Calculate new level client-side (though the trigger will handle this server-side)
  let newLevel = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (newExp >= LEVEL_THRESHOLDS[i].exp) {
      newLevel = LEVEL_THRESHOLDS[i].level;
      break;
    }
  }

  await supabase.from("users").update({ exp_points: newExp }).eq("id", userId);

  // Check if user leveled up
  const leveledUp = newLevel > currentLevel;

  return {
    leveledUp,
    newLevel: leveledUp ? newLevel : undefined,
    oldLevel: leveledUp ? currentLevel : undefined,
  };
}

// Bookmark a thread
export async function bookmarkThread(
  userId: string,
  threadId: string,
): Promise<void> {
  const { error } = await supabase.from("forum_bookmarks").insert({
    user_id: userId,
    thread_id: threadId,
  });

  if (error) throw error;
}

// Remove bookmark from a thread
export async function unbookmarkThread(
  userId: string,
  threadId: string,
): Promise<void> {
  const { error } = await supabase.from("forum_bookmarks").delete().match({
    user_id: userId,
    thread_id: threadId,
  });

  if (error) throw error;
}

// Follow a thread to receive notifications
export async function followThread(
  userId: string,
  threadId: string,
): Promise<void> {
  const { error } = await supabase.from("forum_follows").insert({
    user_id: userId,
    thread_id: threadId,
  });

  if (error) throw error;
}

// Unfollow a thread
export async function unfollowThread(
  userId: string,
  threadId: string,
): Promise<void> {
  const { error } = await supabase.from("forum_follows").delete().match({
    user_id: userId,
    thread_id: threadId,
  });

  if (error) throw error;
}

// Report inappropriate content
export async function reportContent(
  reporterId: string,
  threadId?: string,
  replyId?: string,
  reason: string = "Inappropriate content",
  isPriority: boolean = false,
): Promise<void> {
  const { error } = await supabase.from("forum_reports").insert({
    reporter_id: reporterId,
    thread_id: threadId || null,
    reply_id: replyId || null,
    reason: reason,
    status: "pending",
    priority: isPriority ? "high" : "normal",
  });

  if (error) throw error;
}

// Delete a thread
export async function deleteThread(threadId: string): Promise<void> {
  // First delete all replies to the thread
  await supabase.from("forum_replies").delete().eq("thread_id", threadId);

  // Delete all votes on the thread
  await supabase.from("forum_votes").delete().eq("thread_id", threadId);

  // Delete all bookmarks of the thread
  await supabase.from("forum_bookmarks").delete().eq("thread_id", threadId);

  // Delete all follows of the thread
  await supabase.from("forum_follows").delete().eq("thread_id", threadId);

  // Delete all reports of the thread
  await supabase.from("forum_reports").delete().eq("thread_id", threadId);

  // Finally delete the thread itself
  const { error } = await supabase
    .from("forum_threads")
    .delete()
    .eq("id", threadId);

  if (error) throw error;
}

// Pin a thread to the top of a category
export async function pinThread(threadId: string): Promise<void> {
  const { error } = await supabase
    .from("forum_threads")
    .update({ is_pinned: true })
    .eq("id", threadId);

  if (error) throw error;
}

// Unpin a thread
export async function unpinThread(threadId: string): Promise<void> {
  const { error } = await supabase
    .from("forum_threads")
    .update({ is_pinned: false })
    .eq("id", threadId);

  if (error) throw error;
}

// Get notifications for a user
export async function getNotifications(
  userId: string,
): Promise<ForumNotification[]> {
  const { data, error } = await supabase
    .from("forum_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Mark a notification as read
export async function markNotificationAsRead(
  notificationId: string,
): Promise<void> {
  const { error } = await supabase
    .from("forum_notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) throw error;
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("forum_notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) throw error;
}

// Create a notification
export async function createNotification(
  userId: string,
  message: string,
  type: string,
  threadId?: string,
  replyId?: string,
): Promise<void> {
  const { error } = await supabase.from("forum_notifications").insert({
    user_id: userId,
    message,
    type,
    thread_id: threadId || null,
    reply_id: replyId || null,
    read: false,
  });

  if (error) throw error;
}

// Create a reply notification
export async function createReplyNotification(
  threadId: string,
  replyId: string,
  replierName: string,
): Promise<void> {
  // Get thread author
  const { data: thread } = await supabase
    .from("forum_threads")
    .select("user_id, title")
    .eq("id", threadId)
    .single();

  if (!thread) return;

  // Don't notify if replying to own thread
  const { data: reply } = await supabase
    .from("forum_replies")
    .select("user_id")
    .eq("id", replyId)
    .single();

  if (!reply || reply.user_id === thread.user_id) return;

  // Create notification
  await createNotification(
    thread.user_id,
    `${replierName} membalas thread Anda "${thread.title.substring(0, 30)}${thread.title.length > 30 ? "..." : ""}"`,
    "reply",
    threadId,
    replyId,
  );
}

// Create a mention notification
export async function createMentionNotification(
  content: string,
  authorId: string,
  authorName: string,
  threadId: string,
  replyId?: string,
): Promise<void> {
  // Extract mentions from content (format: @username)
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions = content.match(mentionRegex) || [];

  if (mentions.length === 0) return;

  // Get unique usernames without the @ symbol
  const usernames = [...new Set(mentions.map((m) => m.substring(1)))];

  // Find users by username
  const { data: users } = await supabase
    .from("users")
    .select("id, username")
    .in("username", usernames);

  if (!users || users.length === 0) return;

  // Create notification for each mentioned user
  for (const user of users) {
    // Don't notify self-mentions
    if (user.id === authorId) continue;

    await createNotification(
      user.id,
      `${authorName} menyebut Anda dalam ${replyId ? "balasan" : "thread"}`,
      "mention",
      threadId,
      replyId,
    );
  }
}

// Create a vote notification
export async function createVoteNotification(
  targetUserId: string,
  voterName: string,
  voteType: string,
  threadId?: string,
  replyId?: string,
): Promise<void> {
  // Don't notify for bata votes (negative)
  if (voteType === "bata") return;

  let contentType = "thread";
  let contentTitle = "";

  if (threadId) {
    const { data: thread } = await supabase
      .from("forum_threads")
      .select("title")
      .eq("id", threadId)
      .single();

    if (thread) {
      contentTitle = thread.title;
    }
  } else if (replyId) {
    contentType = "balasan";

    // Get thread title for context
    const { data: reply } = await supabase
      .from("forum_replies")
      .select("thread_id")
      .eq("id", replyId)
      .single();

    if (reply) {
      const { data: thread } = await supabase
        .from("forum_threads")
        .select("title")
        .eq("id", reply.thread_id)
        .single();

      if (thread) {
        contentTitle = thread.title;
      }
    }
  }

  const message = `${voterName} memberi cendol pada ${contentType} Anda ${contentTitle ? `di "${contentTitle.substring(0, 30)}${contentTitle.length > 30 ? "..." : ""}"` : ""}`;

  await createNotification(targetUserId, message, "vote", threadId, replyId);
}

// Create a level up notification
export async function createLevelUpNotification(
  userId: string,
  newLevel: number,
  oldLevel: number,
): Promise<void> {
  await createNotification(
    userId,
    `Selamat! Anda telah naik level dari ${oldLevel} ke ${newLevel}`,
    "level_up",
  );
}

// Get user's bookmarked threads
export async function getUserBookmarks(userId: string): Promise<ForumThread[]> {
  const { data, error } = await supabase
    .from("forum_bookmarks")
    .select("thread:thread_id(*, user:user_id(full_name, avatar_url, exp))")
    .eq("user_id", userId);

  if (error) throw error;

  // Extract threads from the response and add vote counts
  const bookmarkedThreads = await Promise.all(
    (data || []).map(async (bookmark) => {
      const thread = bookmark.thread;

      // Get vote counts
      const { data: cendolCount } = await supabase
        .from("forum_votes")
        .select("id", { count: "exact" })
        .eq("thread_id", thread.id)
        .eq("vote_type", "cendol");

      const { data: bataCount } = await supabase
        .from("forum_votes")
        .select("id", { count: "exact" })
        .eq("thread_id", thread.id)
        .eq("vote_type", "bata");

      // Get reply count
      const { data: replyCount } = await supabase
        .from("forum_replies")
        .select("id", { count: "exact" })
        .eq("thread_id", thread.id);

      return {
        ...thread,
        vote_count: {
          cendol: cendolCount?.length || 0,
          bata: bataCount?.length || 0,
        },
        reply_count: replyCount?.length || 0,
      };
    }),
  );

  return bookmarkedThreads;
}

// Get user badges
export async function getUserBadges(userId: string): Promise<ForumBadge[]> {
  const { data, error } = await supabase
    .from("forum_user_badges")
    .select("badge:badge_id(*)")
    .eq("user_id", userId);

  if (error) throw error;

  return (data || []).map((item) => item.badge as ForumBadge);
}

// Get all available badges
export async function getAllBadges(): Promise<ForumBadge[]> {
  const { data, error } = await supabase
    .from("forum_badges")
    .select("*")
    .order("requirement_count", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Check if user has a specific badge
export async function hasUserBadge(
  userId: string,
  badgeId: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("forum_user_badges")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("badge_id", badgeId);

  if (error) throw error;
  return count > 0;
}

// Get leaderboard data
export async function getLeaderboard(
  timeFrame: "week" | "month" | "all" = "month",
): Promise<any[]> {
  let query = supabase
    .from("users")
    .select(
      "id, full_name, avatar_url, exp_points as exp, level, badges:forum_user_badges(badge:badge_id(*))",
    )
    .order("exp_points", { ascending: false })
    .limit(10);

  // Apply time frame filter if not "all"
  if (timeFrame !== "all") {
    const now = new Date();
    let startDate = new Date();

    if (timeFrame === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (timeFrame === "month") {
      startDate.setMonth(now.getMonth() - 1);
    }

    query = query.gte("updated_at", startDate.toISOString());
  }

  const { data, error } = await query;

  if (error) throw error;

  // Format the badges data
  return (data || []).map((user) => {
    return {
      ...user,
      badges: user.badges?.map((b: any) => b.badge) || [],
    };
  });
}
