// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { supabase } from "../../lib/supabase";
// @ts-ignore
import { useAuth } from "../../lib/auth-provider";

interface UnreadMessagesIndicatorProps {
  className?: string;
}

export function UnreadMessagesIndicator({ className }: UnreadMessagesIndicatorProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        // Get count of conversations with unread messages
        const { count, error } = await supabase
          .from("private_conversation_participants")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("has_unread", true);
        
        if (error) throw error;
        
        setUnreadCount(count || 0);
      } catch (error) {
        console.error("Error fetching unread messages count:", error);
      }
    };
    
    fetchUnreadCount();
    
    // Set up realtime subscription for message notifications
    const subscription = supabase
      .channel("chat_notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  if (unreadCount === 0) {
    return null;
  }

  return (
    <Badge className={`h-5 w-5 flex items-center justify-center p-0 bg-red-500 ${className}`}>
      {unreadCount > 9 ? "9+" : unreadCount}
    </Badge>
  );
}


