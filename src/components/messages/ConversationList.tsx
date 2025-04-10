import React, { useState } from "react";
import OnlineStatusIndicator from "./OnlineStatusIndicator";
import { PrivateConversation } from "@/types/messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  X,
  Archive,
  Trash2,
  MoreHorizontal,
  ArchiveRestore,
  Inbox,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { useAuth } from "../../../supabase/auth";
import { cn } from "@/lib/utils";
import { useConversation } from "@/contexts/ConversationContext";

interface ConversationListProps {
  selectedConversationId?: string;
  onSelectConversation: (conversation: PrivateConversation) => void;
  onNewConversation: () => void;
}

export default function ConversationList({
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationListProps) {
  const { user } = useAuth();
  const {
    conversations,
    archivedConversations,
    isLoadingConversations: isLoading,
    isLoadingArchivedConversations: isLoadingArchived,
    archiveConversation,
    unarchiveConversation,
    deleteConversation,
    loadArchivedConversations,
  } = useConversation();
  const [searchTerm, setSearchTerm] = useState("");
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);
  const [activeTab, setActiveTab] = useState<"inbox" | "archived">("inbox");

  // Load archived conversations when showing archived view
  React.useEffect(() => {
    if (activeTab === "archived") {
      loadArchivedConversations();
    }
  }, [activeTab, loadArchivedConversations]);

  const displayedConversations =
    activeTab === "archived" ? archivedConversations : conversations;

  const filteredConversations = displayedConversations.filter(
    (conversation) => {
      const otherParticipants = conversation.participants?.filter(
        (p) => p.user_id !== user?.id,
      );
      const otherUserNames = otherParticipants?.map(
        (p) => p.user?.full_name || p.user?.username || "",
      );
      return otherUserNames?.some((name) =>
        name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    },
  );

  const handleArchive = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    archiveConversation(conversationId);
  };

  const handleUnarchive = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    unarchiveConversation(conversationId);
  };

  const confirmDelete = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
  };

  const handleDelete = () => {
    if (conversationToDelete) {
      deleteConversation(conversationToDelete);
      setConversationToDelete(null);
    }
  };

  if (isLoading || (activeTab === "archived" && isLoadingArchived)) {
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
          <Tabs defaultValue="inbox" className="w-full mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inbox" disabled>
                <Inbox className="h-4 w-4 mr-2" />
                Inbox
              </TabsTrigger>
              <TabsTrigger value="archived" disabled>
                <Archive className="h-4 w-4 mr-2" />
                Arsip
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
          {activeTab === "inbox" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={onNewConversation}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "inbox" | "archived")}
          className="w-full mb-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inbox">
              <Inbox className="h-4 w-4 mr-2" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="archived">
              <Archive className="h-4 w-4 mr-2" />
              Arsip
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari percakapan..."
            className="pl-9 pr-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-7 w-7 p-0"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          )}
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
              <div
                key={conversation.id}
                className={cn(
                  "flex w-full px-4 py-3 h-auto",
                  selectedConversationId === conversation.id
                    ? "bg-purple-50"
                    : "hover:bg-gray-50",
                )}
              >
                <Button
                  variant="ghost"
                  className="flex-1 justify-start p-0 h-auto"
                  onClick={() => onSelectConversation(conversation)}
                >
                  <div className="flex items-start w-full">
                    <div className="relative">
                      <div className="relative">
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
                          {otherParticipants?.[0]?.user_id && (
                            <OnlineStatusIndicator
                              userId={otherParticipants[0].user_id}
                              className="absolute bottom-0 right-2"
                            />
                          )}
                        </div>
                        {otherParticipants?.[0]?.user_id && (
                          <OnlineStatusIndicator
                            userId={otherParticipants[0].user_id}
                            className="absolute bottom-0 right-2"
                          />
                        )}
                      </div>
                      {conversation.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-medium text-gray-900 truncate">
                          {otherUser?.full_name ||
                            otherUser?.username ||
                            "User"}
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
                        {conversation.last_message?.content ||
                          "Belum ada pesan"}
                      </p>
                    </div>
                  </div>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 ml-1"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {activeTab === "archived" ? (
                      <DropdownMenuItem
                        onClick={(e) => handleUnarchive(conversation.id, e)}
                      >
                        <ArchiveRestore className="h-4 w-4 mr-2" />
                        Unarchive
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={(e) => handleArchive(conversation.id, e)}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => confirmDelete(conversation.id, e)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        )}
      </div>

      <AlertDialog
        open={!!conversationToDelete}
        onOpenChange={(open) => !open && setConversationToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
