import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth-provider";
import { PrivateMessage } from "@/types/messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Check, Loader2 } from "lucide-react";
import MessageRenderer from "./MessageRenderer";

interface ForwardMessageDialogProps {
  message: PrivateMessage;
  trigger: React.ReactNode;
}

interface Conversation {
  id: string;
  title?: string;
  is_group?: boolean;
  last_message_at: string;
  participants: {
    user_id: string;
    user?: {
      full_name?: string;
      avatar_url?: string;
    };
  }[];
}

export default function ForwardMessageDialog({
  message,
  trigger,
}: ForwardMessageDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [forwarding, setForwarding] = useState(false);

  useEffect(() => {
    if (!user || !open) return;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("private_conversations")
          .select(
            `
            id,
            title,
            is_group,
            last_message_at,
            participants:private_conversation_participants(
              user_id,
              user:user_id(full_name, avatar_url)
            )
          `
          )
          .contains("participants.user_id", [user.id])
          .order("last_message_at", { ascending: false });

        if (error) throw error;
        setConversations(data || []);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        toast({
          title: "Error",
          description: "Gagal memuat daftar percakapan. Silakan coba lagi.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user, open, toast]);

  const getConversationName = (conversation: Conversation) => {
    if (conversation.is_group && conversation.title) {
      return conversation.title;
    }

    // For direct messages, show the other user's name
    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== user?.id
    );
    return otherParticipant?.user?.full_name || "Pengguna";
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.is_group) {
      return null; // Group chats don't have avatars
    }

    // For direct messages, show the other user's avatar
    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== user?.id
    );
    return (
      otherParticipant?.user?.avatar_url ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherParticipant?.user_id}`
    );
  };

  const toggleConversation = (conversationId: string) => {
    setSelectedConversations((prev) =>
      prev.includes(conversationId)
        ? prev.filter((id) => id !== conversationId)
        : [...prev, conversationId]
    );
  };

  const handleForward = async () => {
    if (!user || selectedConversations.length === 0) return;

    try {
      setForwarding(true);

      // Create a new message for each selected conversation
      const forwardPromises = selectedConversations.map(async (conversationId) => {
        // Add a "Forwarded" label to the message content
        const forwardedContent = `<div class="text-xs text-gray-500 mb-1">Pesan diteruskan</div>${message.content}`;

        await supabase.from("private_messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: forwardedContent,
          is_forwarded: true,
          original_message_id: message.id,
        });

        // Update conversation's last_message_at
        await supabase
          .from("private_conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", conversationId);
      });

      await Promise.all(forwardPromises);

      toast({
        title: "Pesan Diteruskan",
        description: `Pesan berhasil diteruskan ke ${selectedConversations.length} percakapan.`,
      });

      setOpen(false);
      setSelectedConversations([]);
    } catch (error) {
      console.error("Error forwarding message:", error);
      toast({
        title: "Error",
        description: "Gagal meneruskan pesan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setForwarding(false);
    }
  };

  const filteredConversations = conversations.filter((conversation) => {
    if (!searchTerm.trim()) return true;
    
    const conversationName = getConversationName(conversation).toLowerCase();
    return conversationName.includes(searchTerm.toLowerCase());
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Teruskan Pesan</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-500 mb-1">Pesan:</div>
            <div className="text-sm">
              <MessageRenderer content={message.content} />
            </div>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari percakapan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">Memuat percakapan...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500">
                Tidak ada percakapan yang ditemukan
              </p>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex items-center justify-between p-3 rounded-md cursor-pointer ${
                    selectedConversations.includes(conversation.id)
                      ? "bg-purple-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => toggleConversation(conversation.id)}
                >
                  <div className="flex items-center">
                    {conversation.is_group ? (
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-purple-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                      </div>
                    ) : (
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage
                          src={getConversationAvatar(conversation)}
                          alt={getConversationName(conversation)}
                        />
                        <AvatarFallback>
                          {getConversationName(conversation)[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <p className="font-medium">
                        {getConversationName(conversation)}
                      </p>
                      {conversation.is_group && (
                        <p className="text-xs text-gray-500">
                          {conversation.participants.length} peserta
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedConversations.includes(conversation.id) && (
                    <Check className="h-5 w-5 text-purple-600" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              className="mr-2"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleForward}
              disabled={selectedConversations.length === 0 || forwarding}
            >
              {forwarding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Meneruskan...
                </>
              ) : (
                "Teruskan"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
