import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import { useConversation } from "@/contexts/ConversationContext";
import { PrivateConversation } from "@/types/messages";
import ConversationList from "./ConversationList";
import MessageList from "./MessageList";
import MessageComposer from "./MessageComposer";
import NewConversationDialog from "./NewConversationDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import OnlineStatusIndicator from "./OnlineStatusIndicator";
import { useToast } from "@/components/ui/use-toast";

export default function MessagesLayout() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    conversations,
    selectedConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSendingMessage,
    selectConversation,
    createConversation,
    sendMessage,
    markConversationAsRead,
  } = useConversation();

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

  // Load conversation if ID is provided in URL
  useEffect(() => {
    if (conversationId && user) {
      const conversation = conversations.find((c) => c.id === conversationId);
      if (conversation) {
        selectConversation(conversation);
        if (isMobileView) {
          setShowConversationList(false);
        }
      }
    }
  }, [conversationId, conversations, user, isMobileView, selectConversation]);

  const handleSelectConversation = (conversation: PrivateConversation) => {
    selectConversation(conversation);
    if (isMobileView) {
      setShowConversationList(false);
    }
  };

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  const handleCreateConversation = async (userId: string) => {
    await createConversation(userId);
    setShowNewConversationDialog(false);
    if (isMobileView) {
      setShowConversationList(false);
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
            selectedConversationId={selectedConversation?.id}
            onSelectConversation={handleSelectConversation}
            onNewConversation={() => setShowNewConversationDialog(true)}
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
                <div className="relative">
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
                  {otherParticipant && (
                    <OnlineStatusIndicator
                      userId={otherParticipant.user_id}
                      className="absolute bottom-0 right-2"
                    />
                  )}
                </div>
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
                <MessageList />
              </div>

              {/* Message Composer */}
              <MessageComposer onSendMessage={handleSendMessage} />
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
