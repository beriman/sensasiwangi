import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";
import {
  getUserConversations,
  getConversationMessages,
  sendMessage,
  createConversation,
  markConversationAsRead,
} from "@/lib/messages";
import { PrivateConversation, PrivateMessage } from "@/types/messages";
import ConversationList from "./ConversationList";
import MessageList from "./MessageList";
import MessageComposer from "./MessageComposer";
import NewConversationDialog from "./NewConversationDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

export default function MessagesLayout() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<PrivateConversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<PrivateConversation | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showNewConversationDialog, setShowNewConversationDialog] =
    useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showConversationList, setShowConversationList] = useState(
    !conversationId || window.innerWidth >= 768,
  );

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (!mobile) {
        setShowConversationList(true);
      } else if (conversationId) {
        setShowConversationList(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [conversationId]);

  // Load conversations
  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      try {
        setIsLoadingConversations(true);
        const data = await getUserConversations(user.id);
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

    loadConversations();

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
                    {
                      ...newMessage,
                      sender: data,
                    },
                    ...prev,
                  ]);
                }
              });

            // Mark as read if the sender is not the current user
            if (newMessage.sender_id !== user.id) {
              markConversationAsRead(newMessage.conversation_id, user.id);
            }
          }

          // Refresh conversations to update last message and unread count
          getUserConversations(user.id).then((data) => {
            setConversations(data);
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, selectedConversation, toast]);

  // Load conversation if ID is provided in URL
  useEffect(() => {
    if (conversationId && user) {
      const conversation = conversations.find((c) => c.id === conversationId);
      if (conversation) {
        handleSelectConversation(conversation);
        if (isMobileView) {
          setShowConversationList(false);
        }
      }
    }
  }, [conversationId, conversations, user, isMobileView]);

  const loadMessages = async (conversationId: string) => {
    if (!user) return;

    try {
      setIsLoadingMessages(true);
      const messages = await getConversationMessages(conversationId);
      setMessages(messages);

      // Mark conversation as read
      await markConversationAsRead(conversationId, user.id);

      // Update conversations to reflect read status
      const updatedConversations = await getUserConversations(user.id);
      setConversations(updatedConversations);
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

  const handleSelectConversation = (conversation: PrivateConversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
    navigate(`/messages/${conversation.id}`);
  };

  const handleSendMessage = async (content: string) => {
    if (!user || !selectedConversation) return;

    try {
      setIsSendingMessage(true);
      await sendMessage(selectedConversation.id, user.id, content);
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

  const handleCreateConversation = async (userId: string) => {
    if (!user) return;

    try {
      const conversation = await createConversation([user.id, userId]);
      setConversations((prev) => [conversation, ...prev]);
      handleSelectConversation(conversation);
      setShowNewConversationDialog(false);
      if (isMobileView) {
        setShowConversationList(false);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    }
  };

  const getOtherParticipant = () => {
    if (!selectedConversation || !user) return null;

    return selectedConversation.participants?.find(
      (p) => p.user_id !== user.id,
    );
  };

  const otherParticipant = getOtherParticipant();

  return (
    <div className="flex h-full bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      {/* Conversation List */}
      {showConversationList && (
        <div
          className={`${isMobileView ? "w-full" : "w-1/3 border-r border-gray-200"}`}
        >
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversation?.id}
            onSelectConversation={handleSelectConversation}
            onNewConversation={() => setShowNewConversationDialog(true)}
            isLoading={isLoadingConversations}
          />
        </div>
      )}

      {/* Message Area */}
      {(!isMobileView || !showConversationList) && (
        <div className={`${isMobileView ? "w-full" : "w-2/3"} flex flex-col`}>
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-gray-200 flex items-center">
                {isMobileView && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2"
                    onClick={() => setShowConversationList(true)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage
                    src={
                      otherParticipant?.user?.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherParticipant?.user_id}`
                    }
                    alt={otherParticipant?.user?.full_name || "User"}
                  />
                  <AvatarFallback>
                    {otherParticipant?.user?.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-medium">
                    {otherParticipant?.user?.full_name ||
                      otherParticipant?.user?.username ||
                      "User"}
                  </h3>
                </div>
                <Button variant="ghost" size="icon">
                  <Info className="h-5 w-5" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto">
                <MessageList
                  messages={messages}
                  isLoading={isLoadingMessages}
                />
              </div>

              {/* Message Composer */}
              <MessageComposer
                onSendMessage={handleSendMessage}
                isLoading={isSendingMessage}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-lg font-medium">Pesan Pribadi</p>
                <p className="text-sm mt-2 max-w-md">
                  Pilih percakapan atau mulai percakapan baru untuk mengirim
                  pesan pribadi ke pengguna lain
                </p>
                <Button
                  className="mt-4 bg-purple-500 hover:bg-purple-600"
                  onClick={() => setShowNewConversationDialog(true)}
                >
                  Mulai Percakapan Baru
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Conversation Dialog */}
      <NewConversationDialog
        isOpen={showNewConversationDialog}
        onClose={() => setShowNewConversationDialog(false)}
        onCreateConversation={handleCreateConversation}
      />
    </div>
  );
}
