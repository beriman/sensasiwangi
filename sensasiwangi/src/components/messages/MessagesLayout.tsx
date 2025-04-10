import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  Search, 
  PlusCircle, 
  Send, 
  Paperclip, 
  Smile,
  MoreVertical,
  Phone,
  Video,
  Info,
  User,
  Users,
  Clock
} from "lucide-react";
import MessageButton from "./MessageButton";

interface Conversation {
  id: string;
  title: string | null;
  is_group: boolean;
  created_at: string;
  last_message: string | null;
  last_message_at: string | null;
  has_unread: boolean;
  participants: {
    user_id: string;
    username: string;
    avatar_url: string | null;
    is_online: boolean;
    last_seen: string | null;
  }[];
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender: {
    username: string;
    avatar_url: string | null;
  };
}

export default function MessagesLayout() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from("private_conversation_participants")
          .select(`
            conversation:conversation_id (
              id,
              title,
              is_group,
              created_at,
              last_message,
              last_message_at
            ),
            has_unread
          `)
          .eq("user_id", user.id)
          .order("conversation(last_message_at)", { ascending: false });
        
        if (error) throw error;
        
        // Fetch participants for each conversation
        const conversationsWithParticipants = await Promise.all(
          data.map(async (item) => {
            const { data: participantsData, error: participantsError } = await supabase
              .from("private_conversation_participants")
              .select(`
                user:user_id (
                  id,
                  username,
                  avatar_url,
                  is_online,
                  last_seen
                )
              `)
              .eq("conversation_id", item.conversation.id);
            
            if (participantsError) throw participantsError;
            
            const participants = participantsData.map((p) => ({
              user_id: p.user.id,
              username: p.user.username,
              avatar_url: p.user.avatar_url,
              is_online: p.user.is_online,
              last_seen: p.user.last_seen,
            }));
            
            return {
              ...item.conversation,
              has_unread: item.has_unread,
              participants,
            };
          })
        );
        
        setConversations(conversationsWithParticipants);
        
        // Set active conversation to the first one if none is selected
        if (conversationsWithParticipants.length > 0 && !activeConversation) {
          setActiveConversation(conversationsWithParticipants[0]);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversations();
    
    // Set up realtime subscription for new messages
    const subscription = supabase
      .channel("private_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // Update messages if the new message belongs to the active conversation
          if (activeConversation && newMessage.conversation_id === activeConversation.id) {
            setMessages((prev) => [...prev, newMessage]);
            
            // Mark message as read if it's not from the current user
            if (newMessage.sender_id !== user.id) {
              markMessageAsRead(newMessage.id);
            }
          }
          
          // Update conversations list
          fetchConversations();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user, activeConversation]);

  useEffect(() => {
    if (!activeConversation || !user) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from("private_messages")
          .select(`
            id,
            conversation_id,
            sender_id,
            content,
            created_at,
            is_read,
            sender:sender_id (username, avatar_url)
          `)
          .eq("conversation_id", activeConversation.id)
          .order("created_at", { ascending: true });
        
        if (error) throw error;
        
        setMessages(data || []);
        
        // Mark conversation as read
        await supabase
          .from("private_conversation_participants")
          .update({ has_unread: false, last_read_at: new Date().toISOString() })
          .eq("conversation_id", activeConversation.id)
          .eq("user_id", user.id);
        
        // Mark all unread messages as read
        const unreadMessages = data?.filter(
          (m) => !m.is_read && m.sender_id !== user.id
        );
        
        if (unreadMessages && unreadMessages.length > 0) {
          await Promise.all(
            unreadMessages.map((m) => markMessageAsRead(m.id))
          );
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [activeConversation, user]);

  const markMessageAsRead = async (messageId: string) => {
    if (!user) return;
    
    try {
      await supabase
        .from("private_messages")
        .update({ is_read: true })
        .eq("id", messageId);
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !activeConversation || !newMessage.trim()) return;
    
    try {
      setSendingMessage(true);
      
      // Insert message
      const { data, error } = await supabase
        .from("private_messages")
        .insert({
          conversation_id: activeConversation.id,
          sender_id: user.id,
          content: newMessage,
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          created_at,
          is_read,
          sender:sender_id (username, avatar_url)
        `);
      
      if (error) throw error;
      
      // Update conversation's last message
      await supabase
        .from("private_conversations")
        .update({
          last_message: newMessage,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", activeConversation.id);
      
      // Update has_unread for other participants
      await supabase
        .from("private_conversation_participants")
        .update({ has_unread: true })
        .eq("conversation_id", activeConversation.id)
        .neq("user_id", user.id);
      
      // Add message to the list
      if (data && data[0]) {
        setMessages((prev) => [...prev, data[0]]);
      }
      
      // Clear input
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.is_group) {
      return conversation.title || "Group Chat";
    }
    
    // For one-on-one conversations, show the other participant's name
    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== user?.id
    );
    
    return otherParticipant?.username || "Chat";
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.is_group) {
      return null; // Group avatar could be implemented later
    }
    
    // For one-on-one conversations, show the other participant's avatar
    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== user?.id
    );
    
    return otherParticipant?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherParticipant?.user_id}`;
  };

  const getParticipantInitial = (conversation: Conversation) => {
    if (conversation.is_group) {
      return "G";
    }
    
    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== user?.id
    );
    
    return otherParticipant?.username?.[0] || "?";
  };

  const isParticipantOnline = (conversation: Conversation) => {
    if (conversation.is_group) {
      return false;
    }
    
    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== user?.id
    );
    
    return otherParticipant?.is_online || false;
  };

  const getLastSeen = (conversation: Conversation) => {
    if (conversation.is_group) {
      return null;
    }
    
    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== user?.id
    );
    
    return otherParticipant?.last_seen;
  };

  const filteredConversations = conversations.filter((conversation) => {
    if (!searchQuery) return true;
    
    const title = getConversationTitle(conversation).toLowerCase();
    return title.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex h-full">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <MessageButton />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          {loading && !activeConversation ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No conversations yet</p>
              <Button className="mt-4" size="sm" onClick={() => {}}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Start a Conversation
              </Button>
            </div>
          ) : (
            <div>
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    activeConversation?.id === conversation.id
                      ? "bg-gray-100"
                      : ""
                  }`}
                  onClick={() => setActiveConversation(conversation)}
                >
                  <div className="flex items-center">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={getConversationAvatar(conversation)}
                          alt={getConversationTitle(conversation)}
                        />
                        <AvatarFallback>
                          {getParticipantInitial(conversation)}
                        </AvatarFallback>
                      </Avatar>
                      {isParticipantOnline(conversation) && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {getConversationTitle(conversation)}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {conversation.last_message_at
                            ? new Date(conversation.last_message_at).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.last_message || "No messages yet"}
                        </p>
                        {conversation.has_unread && (
                          <Badge className="h-5 w-5 flex items-center justify-center p-0 bg-blue-500">
                            •
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
      
      {/* Messages */}
      <div className="w-2/3 flex flex-col">
        {activeConversation ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={getConversationAvatar(activeConversation)}
                    alt={getConversationTitle(activeConversation)}
                  />
                  <AvatarFallback>
                    {getParticipantInitial(activeConversation)}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    {getConversationTitle(activeConversation)}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center">
                    {isParticipantOnline(activeConversation) ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                        Online
                      </>
                    ) : getLastSeen(activeConversation) ? (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Last seen{" "}
                        {new Date(
                          getLastSeen(activeConversation) as string
                        ).toLocaleString()}
                      </>
                    ) : (
                      "Offline"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Messages List */}
            <ScrollArea className="flex-1 p-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageButton className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Send a message to start the conversation
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isCurrentUser = message.sender_id === user?.id;
                    const showAvatar =
                      index === 0 ||
                      messages[index - 1].sender_id !== message.sender_id;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isCurrentUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isCurrentUser && showAvatar && (
                          <Avatar className="h-8 w-8 mr-2 mt-1">
                            <AvatarImage
                              src={
                                message.sender.avatar_url ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender_id}`
                              }
                              alt={message.sender.username}
                            />
                            <AvatarFallback>
                              {message.sender.username[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-lg ${
                            isCurrentUser
                              ? "bg-purple-500 text-white"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {!isCurrentUser && showAvatar && (
                            <p className="text-xs font-medium mb-1">
                              {message.sender.username}
                            </p>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 text-right ${
                              isCurrentUser
                                ? "text-purple-200"
                                : "text-gray-500"
                            }`}
                          >
                            {new Date(message.created_at).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </p>
                        </div>
                        
                        {isCurrentUser && showAvatar && (
                          <Avatar className="h-8 w-8 ml-2 mt-1">
                            <AvatarImage
                              src={
                                message.sender.avatar_url ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender_id}`
                              }
                              alt={message.sender.username}
                            />
                            <AvatarFallback>
                              {message.sender.username[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
            
            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  className="mx-2"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-8 w-8 ml-2"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                >
                  {sendingMessage ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageButton className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Your Messages
              </h3>
              <p className="text-gray-500 max-w-md mb-6">
                Send private messages to other users or create group chats to
                collaborate with multiple people.
              </p>
              <Button onClick={() => {}}>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Conversation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
