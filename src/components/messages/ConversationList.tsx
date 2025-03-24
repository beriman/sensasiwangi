import React from "react";
import { PrivateConversation } from "@/types/messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { useAuth } from "../../../supabase/auth";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: PrivateConversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: PrivateConversation) => void;
  onNewConversation: () => void;
  isLoading?: boolean;
}

export default function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  isLoading = false,
}: ConversationListProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredConversations = conversations.filter((conversation) => {
    const otherParticipants = conversation.participants?.filter(
      (p) => p.user_id !== user?.id,
    );
    const otherUserNames = otherParticipants?.map(
      (p) => p.user?.full_name || p.user?.username || "",
    );
    return otherUserNames?.some((name) =>
      name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pesan</h2>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={onNewConversation}
              disabled
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Cari percakapan..." className="pl-9" disabled />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center p-3 rounded-lg animate-pulse"
            >
              <div className="h-10 w-10 rounded-full bg-gray-200 mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pesan</h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={onNewConversation}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari percakapan..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <p className="text-gray-500 text-sm">
              {searchTerm
                ? "Tidak ada percakapan yang sesuai"
                : "Belum ada percakapan"}
            </p>
            <Button
              variant="link"
              className="mt-2 text-purple-600"
              onClick={onNewConversation}
            >
              Mulai percakapan baru
            </Button>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            // Find the other participant(s)
            const otherParticipants = conversation.participants?.filter(
              (p) => p.user_id !== user?.id,
            );
            const otherUser = otherParticipants?.[0]?.user;

            return (
              <Button
                key={conversation.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start px-4 py-3 h-auto",
                  selectedConversationId === conversation.id
                    ? "bg-purple-50"
                    : "hover:bg-gray-50",
                )}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="flex items-start w-full">
                  <div className="relative">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage
                        src={
                          otherUser?.avatar_url ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherParticipants?.[0]?.user_id}`
                        }
                        alt={otherUser?.full_name || "User"}
                      />
                      <AvatarFallback>
                        {otherUser?.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium text-gray-900 truncate">
                        {otherUser?.full_name || otherUser?.username || "User"}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                        {conversation.last_message
                          ? formatDistanceToNow(
                              new Date(conversation.last_message.created_at),
                              { addSuffix: false, locale: id },
                            )
                          : ""}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-sm truncate",
                        conversation.unread_count > 0
                          ? "font-medium text-gray-900"
                          : "text-gray-500",
                      )}
                    >
                      {conversation.last_message?.content || "Belum ada pesan"}
                    </p>
                  </div>
                </div>
              </Button>
            );
          })
        )}
      </div>
    </div>
  );
}
