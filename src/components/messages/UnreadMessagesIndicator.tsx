import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getUnreadMessageCount } from "@/lib/messages";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";

interface UnreadMessagesIndicatorProps {
  className?: string;
}

export default function UnreadMessagesIndicator({
  className = "",
}: UnreadMessagesIndicatorProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadMessageCount(user.id);
        setUnreadCount(count);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel("private_messages_unread_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
        },
        (payload) => {
          const newMessage = payload.new as any;
          // If the message is not from the current user, increment unread count
          if (newMessage.sender_id !== user.id) {
            fetchUnreadCount();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "private_conversation_participants",
        },
        () => {
          // When conversation is marked as read, update count
          fetchUnreadCount();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  if (unreadCount === 0) return null;

  return (
    <Badge
      className={`bg-red-500 text-white hover:bg-red-600 ${className}`}
      variant="secondary"
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  );
}
