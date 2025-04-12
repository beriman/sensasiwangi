import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../supabase/auth";
import { supabase } from "../../supabase/supabase";
import {
  getUserConversations,
  getConversationMessages,
  sendMessage as sendMessageApi,
  createConversation as createConversationApi,
  markConversationAsRead as markConversationAsReadApi,
  deleteMessage as deleteMessageApi,
  editMessage as editMessageApi,
  archiveConversation as archiveConversationApi,
  unarchiveConversation as unarchiveConversationApi,
  deleteConversation as deleteConversationApi,
} from "../lib/messages";
import { PrivateConversation, PrivateMessage } from "../types/messages";
import { useToast } from "../components/ui/use-toast";

interface ConversationContextType {
  conversations: PrivateConversation[];
  archivedConversations: PrivateConversation[];
  selectedConversation: PrivateConversation | null;
  messages: PrivateMessage[];
  isLoadingConversations: boolean;
  isLoadingArchivedConversations: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  editingMessage: PrivateMessage | null;
  selectConversation: (conversation: PrivateConversation) => void;
  createConversation: (userId: string) => Promise<void>;
  sendMessage: (content: string, imageUrl?: string) => Promise<void>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  setEditingMessage: (message: PrivateMessage | null) => void;
  archiveConversation: (conversationId: string) => Promise<void>;
  unarchiveConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  loadArchivedConversations: () => Promise<void>;
}

const ConversationContext = createContext<ConversationContextType | undefined>(
  undefined,
);

export function useConversation() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error(
      "useConversation must be used within a ConversationProvider",
    );
  }
  return context;
}

interface ConversationProviderProps {
  children: React.ReactNode;
}

// Define the provider as a named function declaration for better HMR support
function ConversationProviderComponent({
  children,
}: ConversationProviderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<PrivateConversation[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<
    PrivateConversation[]
  >([]);
  const [selectedConversation, setSelectedConversation] =
    useState<PrivateConversation | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingArchivedConversations, setIsLoadingArchivedConversations] =
    useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [editingMessage, setEditingMessage] = useState<PrivateMessage | null>(
    null,
  );

  // Load conversations
  useEffect(() => {
    if (!user) return;
    refreshConversations();

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel("private_messages_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
        },
        (payload) => {
          const newMessage = payload.new as PrivateMessage;
          // If the message is for the current conversation, add it to the messages
          if (
            selectedConversation &&
            newMessage.conversation_id === selectedConversation.id
          ) {
            // Fetch the sender details
            supabase
              .from("users")
              .select("id, full_name, avatar_url, username")
              .eq("id", newMessage.sender_id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      ...newMessage,
                      sender: data,
                    },
                  ]);
                }
              });

            // Mark as read if the sender is not the current user and the conversation is currently selected
            if (newMessage.sender_id !== user.id) {
              markConversationAsReadApi(newMessage.conversation_id, user.id);
            }
          }

          // Refresh conversations to update last message and unread count
          refreshConversations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, selectedConversation]);

  const refreshConversations = async () => {
    if (!user) return;

    try {
      setIsLoadingConversations(true);
      const data = await getUserConversations(user.id, false);
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadArchivedConversations = async () => {
    if (!user) return;

    try {
      setIsLoadingArchivedConversations(true);
      const data = await getUserConversations(user.id, true);
      // Filter to only include archived conversations
      const archived = data.filter((conv) => {
        const userParticipation = conv.participants?.find(
          (p) => p.user_id === user.id,
        );
        return userParticipation?.is_archived;
      });
      setArchivedConversations(archived);
    } catch (error) {
      console.error("Error loading archived conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load archived conversations",
        variant: "destructive",
      });
    } finally {
      setIsLoadingArchivedConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!user) return;

    try {
      setIsLoadingMessages(true);
      const messages = await getConversationMessages(conversationId);
      setMessages(messages);

      // Mark conversation as read when messages are loaded
      await markConversationAsReadApi(conversationId, user.id);

      // Update conversations to reflect read status
      await refreshConversations();
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const selectConversation = (conversation: PrivateConversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
    navigate(`/messages/${conversation.id}`);
  };

  const createConversation = async (userId: string) => {
    if (!user) return;

    try {
      const conversation = await createConversationApi([user.id, userId]);
      setConversations((prev) => [conversation, ...prev]);
      selectConversation(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (content: string, imageUrl?: string) => {
    if (!user || !selectedConversation) return;

    try {
      setIsSendingMessage(true);
      await sendMessageApi(selectedConversation.id, user.id, content, imageUrl);
      // The real-time subscription will handle updating the messages
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    if (!user) return;

    try {
      await markConversationAsReadApi(conversationId, user.id);
      await refreshConversations();
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      await deleteMessageApi(messageId, user.id);
      // Update the messages list
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      // Refresh conversations to update last message
      await refreshConversations();
    } catch (error) {
      console.error("Error deleting message:", error);
      throw error;
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    if (!user) return;

    try {
      const updatedMessage = await editMessageApi(messageId, user.id, content);
      // Update the messages list
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, ...updatedMessage } : msg,
        ),
      );
      // Clear editing state
      setEditingMessage(null);
      // Refresh conversations to update last message if needed
      await refreshConversations();
    } catch (error) {
      console.error("Error editing message:", error);
      throw error;
    }
  };

  const archiveConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      await archiveConversationApi(conversationId, user.id);
      // Update the conversations list
      await refreshConversations();
      // If the archived conversation was selected, navigate back to messages
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        navigate("/messages");
      }
      toast({
        description: "Conversation archived",
      });
    } catch (error) {
      console.error("Error archiving conversation:", error);
      toast({
        title: "Error",
        description: "Failed to archive conversation",
        variant: "destructive",
      });
    }
  };

  const unarchiveConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      await unarchiveConversationApi(conversationId, user.id);
      // Update both conversation lists
      await refreshConversations();
      await loadArchivedConversations();
      toast({
        description: "Conversation unarchived",
      });
    } catch (error) {
      console.error("Error unarchiving conversation:", error);
      toast({
        title: "Error",
        description: "Failed to unarchive conversation",
        variant: "destructive",
      });
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      await deleteConversationApi(conversationId, user.id);
      // Update the conversations list
      await refreshConversations();
      await loadArchivedConversations();
      // If the deleted conversation was selected, navigate back to messages
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        navigate("/messages");
      }
      toast({
        description: "Conversation deleted",
      });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };

  const value = {
    conversations,
    archivedConversations,
    selectedConversation,
    messages,
    isLoadingConversations,
    isLoadingArchivedConversations,
    isLoadingMessages,
    isSendingMessage,
    editingMessage,
    selectConversation,
    createConversation,
    sendMessage,
    markConversationAsRead,
    refreshConversations,
    deleteMessage,
    editMessage,
    setEditingMessage,
    archiveConversation,
    unarchiveConversation,
    deleteConversation,
    loadArchivedConversations,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

// Export the provider as a constant for better HMR support
export const ConversationProvider = ConversationProviderComponent;

