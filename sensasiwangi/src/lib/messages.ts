import { supabase } from "../../supabase/supabase";
import { PrivateConversation, PrivateMessage } from "../types/messages";

// Get all conversations for a user
export async function getUserConversations(
  userId: string,
  includeArchived: boolean = false,
): Promise<PrivateConversation[]> {
  // Get all conversations the user is part of
  let query = supabase
    .from("private_conversation_participants")
    .select("conversation_id, is_archived, is_deleted")
    .eq("user_id", userId);

  // Don't include deleted conversations
  query = query.eq("is_deleted", false);

  // Only include non-archived conversations unless specifically requested
  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data: participations, error: participationsError } = await query;

  if (participationsError) throw participationsError;
  if (!participations || participations.length === 0) return [];

  const conversationIds = participations.map((p) => p.conversation_id);

  // Get the conversations with their last message
  const { data: conversations, error: conversationsError } = await supabase
    .from("private_conversations")
    .select("*")
    .in("id", conversationIds)
    .order("last_message_at", { ascending: false });

  if (conversationsError) throw conversationsError;
  if (!conversations) return [];

  // For each conversation, get participants and last message
  const conversationsWithDetails = await Promise.all(
    conversations.map(async (conversation) => {
      // Get participants
      const { data: participants } = await supabase
        .from("private_conversation_participants")
        .select("*, user:user_id(id, full_name, avatar_url, username)")
        .eq("conversation_id", conversation.id);

      // Get last message
      const { data: messages } = await supabase
        .from("private_messages")
        .select("*, sender:sender_id(id, full_name, avatar_url, username)")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: false })
        .limit(1);

      // Get unread count
      const { data: participant } = await supabase
        .from("private_conversation_participants")
        .select("last_read_at")
        .eq("conversation_id", conversation.id)
        .eq("user_id", userId)
        .single();

      const lastReadAt = participant?.last_read_at;

      const { count: unreadCount } = await supabase
        .from("private_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conversation.id)
        .neq("sender_id", userId)
        .gt("created_at", lastReadAt || new Date(0).toISOString());

      return {
        ...conversation,
        participants: participants || [],
        last_message: messages && messages.length > 0 ? messages[0] : undefined,
        unread_count: unreadCount || 0,
      };
    }),
  );

  return conversationsWithDetails;
}

// Get messages for a specific conversation
export async function getConversationMessages(
  conversationId: string,
  limit: number = 50,
  before?: string,
): Promise<PrivateMessage[]> {
  let query = supabase
    .from("private_messages")
    .select("*, sender:sender_id(id, full_name, avatar_url, username)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

// Get a specific conversation by ID
export async function getConversation(
  conversationId: string,
): Promise<PrivateConversation | null> {
  const { data, error } = await supabase
    .from("private_conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // No rows returned
    throw error;
  }

  // Get participants
  const { data: participants } = await supabase
    .from("private_conversation_participants")
    .select("*, user:user_id(id, full_name, avatar_url, username)")
    .eq("conversation_id", conversationId);

  return {
    ...data,
    participants: participants || [],
  };
}

// Send a message in a conversation
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  imageUrl?: string,
): Promise<PrivateMessage> {
  const messageData: any = {
    conversation_id: conversationId,
    sender_id: senderId,
    content,
  };

  if (imageUrl) {
    messageData.image_url = imageUrl;
  }

  const { data, error } = await supabase
    .from("private_messages")
    .insert(messageData)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

// Create a new conversation between users
export async function createConversation(
  userIds: string[],
): Promise<PrivateConversation> {
  // Check if a conversation already exists between these users
  const existingConversation = await findExistingConversation(userIds);
  if (existingConversation) return existingConversation;

  // Create a new conversation
  const { data: conversation, error: conversationError } = await supabase
    .from("private_conversations")
    .insert({})
    .select()
    .single();

  if (conversationError) throw conversationError;

  // Add participants
  const participants = userIds.map((userId) => ({
    conversation_id: conversation.id,
    user_id: userId,
  }));

  const { error: participantsError } = await supabase
    .from("private_conversation_participants")
    .insert(participants);

  if (participantsError) throw participantsError;

  // Get the full conversation with participants
  return getConversation(conversation.id) as Promise<PrivateConversation>;
}

// Find an existing conversation between users
async function findExistingConversation(
  userIds: string[],
): Promise<PrivateConversation | null> {
  // For each user, get their conversations
  const userConversationsPromises = userIds.map((userId) =>
    supabase
      .from("private_conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId),
  );

  const userConversationsResults = await Promise.all(userConversationsPromises);
  const userConversations = userConversationsResults.map(
    (result) => result.data || [],
  );

  // Find conversations that all users are part of
  if (userConversations.some((conversations) => conversations.length === 0)) {
    return null; // At least one user has no conversations
  }

  const conversationIds = userConversations[0].map((p) => p.conversation_id);
  const commonConversations = conversationIds.filter((conversationId) =>
    userConversations.every((userConvs) =>
      userConvs.some((p) => p.conversation_id === conversationId),
    ),
  );

  if (commonConversations.length === 0) return null;

  // For each common conversation, check if it has exactly these users and no others
  for (const conversationId of commonConversations) {
    const { data: participants } = await supabase
      .from("private_conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId);

    if (!participants) continue;

    const participantIds = participants.map((p) => p.user_id);
    if (
      participantIds.length === userIds.length &&
      userIds.every((userId) => participantIds.includes(userId))
    ) {
      // This is a conversation with exactly these users
      return getConversation(conversationId);
    }
  }

  return null;
}

// Mark messages in a conversation as read
export async function markConversationAsRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  // Update the last_read_at timestamp to the current time
  const currentTime = new Date().toISOString();

  const { error } = await supabase
    .from("private_conversation_participants")
    .update({ last_read_at: currentTime })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error marking conversation as read:", error);
    throw error;
  }

  // Return silently on success
}

// Archive a conversation for a user
export async function archiveConversation(
  conversationId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("private_conversation_participants")
    .update({ is_archived: true })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error archiving conversation:", error);
    throw error;
  }
}

// Unarchive a conversation for a user
export async function unarchiveConversation(
  conversationId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("private_conversation_participants")
    .update({ is_archived: false })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error unarchiving conversation:", error);
    throw error;
  }
}

// Delete a conversation for a user
export async function deleteConversation(
  conversationId: string,
  userId: string,
): Promise<void> {
  // We don't actually delete the conversation, just mark it as deleted for this user
  const { error } = await supabase
    .from("private_conversation_participants")
    .update({ is_deleted: true })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting conversation:", error);
    throw error;
  }
}

// Get total unread message count for a user
export async function getUnreadMessageCount(userId: string): Promise<number> {
  // Get all conversations the user is part of
  const { data: participations, error: participationsError } = await supabase
    .from("private_conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId);

  if (participationsError) throw participationsError;
  if (!participations || participations.length === 0) return 0;

  // For each conversation, count unread messages
  const unreadCounts = await Promise.all(
    participations.map(async (participation) => {
      const { count } = await supabase
        .from("private_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", participation.conversation_id)
        .neq("sender_id", userId)
        .gt(
          "created_at",
          participation.last_read_at || new Date(0).toISOString(),
        );

      return count || 0;
    }),
  );

  // Sum up all unread counts
  return unreadCounts.reduce((total, count) => total + count, 0);
}

// Delete a message
export async function deleteMessage(
  messageId: string,
  userId: string,
): Promise<void> {
  // Check if user is the sender
  const { data: message, error: messageError } = await supabase
    .from("private_messages")
    .select("sender_id, created_at")
    .eq("id", messageId)
    .single();

  if (messageError) throw messageError;
  if (message.sender_id !== userId) {
    throw new Error("You can only delete your own messages");
  }

  // Check if message is within the time limit for deletion (24 hours)
  const messageDate = new Date(message.created_at);
  const currentDate = new Date();
  const hoursDifference =
    (currentDate.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

  if (hoursDifference > 24) {
    throw new Error("Messages can only be deleted within 24 hours of sending");
  }

  // Delete the message
  const { error } = await supabase
    .from("private_messages")
    .delete()
    .eq("id", messageId);

  if (error) throw error;
}

// Edit a message
export async function editMessage(
  messageId: string,
  userId: string,
  content: string,
): Promise<PrivateMessage> {
  // Check if user is the sender
  const { data: message, error: messageError } = await supabase
    .from("private_messages")
    .select("sender_id, created_at")
    .eq("id", messageId)
    .single();

  if (messageError) throw messageError;
  if (message.sender_id !== userId) {
    throw new Error("You can only edit your own messages");
  }

  // Check if message is within the time limit for editing (1 hour)
  const messageDate = new Date(message.created_at);
  const currentDate = new Date();
  const hoursDifference =
    (currentDate.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

  if (hoursDifference > 1) {
    throw new Error("Messages can only be edited within 1 hour of sending");
  }

  // Update the message
  const { data, error } = await supabase
    .from("private_messages")
    .update({
      content,
      updated_at: new Date().toISOString(),
      is_edited: true,
    })
    .eq("id", messageId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

