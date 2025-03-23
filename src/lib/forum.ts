import { supabase } from "../../supabase/supabase";
import {
  ForumCategory,
  ForumThread,
  ForumReply,
  VoteType,
} from "@/types/forum";

// Experience points constants
const EXP_CREATE_THREAD = 1;
const EXP_RECEIVE_CENDOL = 5;
const EXP_RECEIVE_BATA = -3;

// Level thresholds
const LEVEL_THRESHOLDS = [
  { level: 1, exp: 0, title: "Newbie" },
  { level: 2, exp: 100, title: "Apprentice" },
  { level: 3, exp: 300, title: "Enthusiast" },
  { level: 4, exp: 600, title: "Expert" },
  { level: 5, exp: 1000, title: "Master" },
  { level: 6, exp: 1500, title: "Grandmaster" },
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

  // Update user EXP
  const expResult = await updateUserExp(userId, EXP_CREATE_THREAD);

  return {
    thread: data,
    levelUp: expResult.leveledUp
      ? { newLevel: expResult.newLevel!, oldLevel: expResult.oldLevel! }
      : undefined,
  };
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
  return data;
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

  // If vote exists and is the same type, remove it (toggle off)
  if (existingVote && existingVote.vote_type === voteType) {
    await supabase.from("forum_votes").delete().match({ id: existingVote.id });

    // Reverse the EXP change
    const targetUserId = threadId
      ? await getThreadAuthor(threadId)
      : await getReplyAuthor(replyId!);

    if (targetUserId) {
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

    if (targetUserId) {
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

      if (expResult.leveledUp) {
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

  if (targetUserId) {
    const expChange =
      voteType === "cendol" ? EXP_RECEIVE_CENDOL : EXP_RECEIVE_BATA;
    const expResult = await updateUserExp(targetUserId, expChange);

    if (expResult.leveledUp) {
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
  const { data } = await supabase
    .from("forum_votes")
    .select("vote_type")
    .match(
      threadId
        ? { user_id: userId, thread_id: threadId }
        : { user_id: userId, reply_id: replyId },
    )
    .single();

  return data ? (data.vote_type as VoteType) : null;
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
