import React, { useEffect, useRef, useState } from "react";
import { PrivateMessage } from "@/types/messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { useAuth } from "../../../supabase/auth";
import { cn } from "@/lib/utils";
import { useConversation } from "@/contexts/ConversationContext";
import { MoreHorizontal, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";
import DOMPurify from "dompurify";
import OnlineStatusIndicator from "./OnlineStatusIndicator";

export default function MessageList() {
  const { user } = useAuth();
  const {
    messages,
    isLoadingMessages: isLoading,
    deleteMessage: deleteConversationMessage,
    setEditingMessage,
  } = useConversation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Group messages by date
  const groupedMessages: { [date: string]: PrivateMessage[] } = {};
  messages.forEach((message) => {
    const date = new Date(message.created_at).toLocaleDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="text-gray-400 mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <p className="text-sm">Belum ada pesan</p>
          <p className="text-xs mt-1">Mulai percakapan dengan mengirim pesan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 p-4 overflow-y-auto">
      {Object.keys(groupedMessages).map((date) => (
        <div key={date} className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
              {date}
            </div>
          </div>

          {groupedMessages[date].map((message) => {
            const isCurrentUser = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  isCurrentUser ? "justify-end" : "justify-start",
                )}
              >
                <div className="flex max-w-[80%]">
                  {!isCurrentUser && (
                    <div className="relative">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage
                          src={
                            message.sender?.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender_id}`
                          }
                          alt={message.sender?.full_name || "User"}
                        />
                        <AvatarFallback>
                          {message.sender?.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <OnlineStatusIndicator
                        userId={message.sender_id}
                        className="absolute bottom-0 right-0 h-2 w-2"
                      />
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex flex-col",
                      isCurrentUser ? "items-end" : "items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "px-4 py-2 rounded-lg",
                        isCurrentUser
                          ? "bg-purple-500 text-white rounded-br-none"
                          : "bg-gray-100 text-gray-800 rounded-bl-none",
                      )}
                    >
                      {message.content.includes("<") &&
                      message.content.includes("</") ? (
                        <div
                          className="whitespace-pre-wrap break-words"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(message.content),
                          }}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: id,
                        })}
                      </span>
                      {message.is_edited && (
                        <span className="text-xs text-gray-500">(edited)</span>
                      )}

                      {isCurrentUser && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 rounded-full p-0 text-gray-400 hover:text-gray-600"
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-32 p-1" align="end">
                            <div className="flex flex-col space-y-1">
                              {/* Check if message is within 1 hour for editing */}
                              {new Date().getTime() -
                                new Date(message.created_at).getTime() <
                                60 * 60 * 1000 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex items-center justify-start text-xs"
                                  onClick={() => setEditingMessage(message)}
                                >
                                  <Edit2 className="h-3 w-3 mr-2" />
                                  Edit
                                </Button>
                              )}

                              {/* Check if message is within 24 hours for deletion */}
                              {new Date().getTime() -
                                new Date(message.created_at).getTime() <
                                24 * 60 * 60 * 1000 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="flex items-center justify-start text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={async () => {
                                    try {
                                      setIsDeleting(message.id);
                                      await deleteConversationMessage(
                                        message.id,
                                      );
                                      toast({
                                        description:
                                          "Message deleted successfully",
                                      });
                                    } catch (error) {
                                      console.error(
                                        "Error deleting message:",
                                        error,
                                      );
                                      toast({
                                        variant: "destructive",
                                        description:
                                          error instanceof Error
                                            ? error.message
                                            : "Failed to delete message",
                                      });
                                    } finally {
                                      setIsDeleting(null);
                                    }
                                  }}
                                  disabled={isDeleting === message.id}
                                >
                                  {isDeleting === message.id ? (
                                    <div className="h-3 w-3 mr-2 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3 mr-2" />
                                  )}
                                  Delete
                                </Button>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>

                  {isCurrentUser && (
                    <div className="relative">
                      <Avatar className="h-8 w-8 ml-2">
                        <AvatarImage
                          src={
                            user?.user_metadata?.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`
                          }
                          alt={user?.user_metadata?.full_name || "User"}
                        />
                        <AvatarFallback>
                          {user?.user_metadata?.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {user?.id && (
                        <OnlineStatusIndicator
                          userId={user.id}
                          className="absolute bottom-0 right-0 h-2 w-2"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
