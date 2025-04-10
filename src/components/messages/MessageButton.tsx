import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface MessageButtonProps {
  userId?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  label?: string;
}

export default function MessageButton({
  userId,
  variant = "default",
  size = "default",
  className = "",
  showIcon = true,
  label = "New Message",
}: MessageButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("users")
        .select("id, username, avatar_url")
        .ilike("username", `%${searchQuery}%`)
        .neq("id", user?.id)
        .limit(5);
      
      if (error) throw error;
      
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (targetUserId: string) => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    try {
      setCreating(true);
      
      // Check if conversation already exists
      const { data: existingConversation, error: checkError } = await supabase
        .from("private_conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id)
        .in("conversation_id", (subquery) => {
          subquery
            .from("private_conversation_participants")
            .select("conversation_id")
            .eq("user_id", targetUserId);
        })
        .not("conversation_id", "in", (subquery) => {
          subquery
            .from("private_conversations")
            .select("id")
            .eq("is_group", true);
        });
      
      if (checkError) throw checkError;
      
      let conversationId;
      
      if (existingConversation && existingConversation.length > 0) {
        // Conversation already exists
        conversationId = existingConversation[0].conversation_id;
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from("private_conversations")
          .insert({
            is_group: false,
            created_by: user.id,
          })
          .select();
        
        if (createError) throw createError;
        
        conversationId = newConversation[0].id;
        
        // Add participants
        const participants = [
          { conversation_id: conversationId, user_id: user.id },
          { conversation_id: conversationId, user_id: targetUserId },
        ];
        
        const { error: participantsError } = await supabase
          .from("private_conversation_participants")
          .insert(participants);
        
        if (participantsError) throw participantsError;
      }
      
      // Navigate to the conversation
      navigate(`/messages/${conversationId}`);
      setOpen(false);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to create conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // If userId is provided, create a direct message button
  if (userId) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => createConversation(userId)}
        disabled={creating}
      >
        {creating ? (
          <LoadingSpinner className="mr-2" />
        ) : showIcon ? (
          <MessageSquare className="h-4 w-4 mr-2" />
        ) : null}
        {label}
      </Button>
    );
  }

  // Otherwise, create a new message dialog
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {showIcon && <PlusCircle className="h-4 w-4 mr-2" />}
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Find a user</Label>
            <div className="flex gap-2">
              <Input
                id="username"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : "Search"}
              </Button>
            </div>
          </div>
          
          {searchResults.length > 0 ? (
            <div className="space-y-2">
              <Label>Select a user</Label>
              <div className="border rounded-md divide-y">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className={`p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                      selectedUser?.id === result.id ? "bg-gray-50" : ""
                    }`}
                    onClick={() => setSelectedUser(result)}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage
                          src={
                            result.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.id}`
                          }
                          alt={result.username}
                        />
                        <AvatarFallback>{result.username[0]}</AvatarFallback>
                      </Avatar>
                      <span>{result.username}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        createConversation(result.id);
                      }}
                      disabled={creating}
                    >
                      {creating && selectedUser?.id === result.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        "Message"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : searchQuery && !loading ? (
            <p className="text-center text-gray-500 py-4">No users found</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
