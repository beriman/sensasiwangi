import React, { useEffect, useRef } from "react";
import { PrivateMessage } from "@/types/messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { useAuth } from "../../../supabase/auth";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: PrivateMessage[];
  isLoading?: boolean;
}

export default function MessageList({
  messages,
  isLoading = false,
}: MessageListProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
                      <p className="whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
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
                    </div>
                  </div>

                  {isCurrentUser && (
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
