import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabase/supabase";
import { useAuth } from "../../../supabase/auth";

interface OnlineStatusIndicatorProps {
  userId: string;
  className?: string;
}

export default function OnlineStatusIndicator({
  userId,
  className = "",
}: OnlineStatusIndicatorProps) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Get initial online status
    fetchOnlineStatus();

    // Subscribe to changes in online status
    const subscription = supabase
      .channel(`online-status-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          setIsOnline(payload.new.online_status || false);
        },
      )
      .subscribe();

    // Update current user's online status
    if (user?.id === userId) {
      updateOnlineStatus(true);

      // Set up interval to update last_active
      const interval = setInterval(
        () => {
          updateOnlineStatus(true);
        },
        5 * 60 * 1000,
      ); // Every 5 minutes

      // Set up event listeners for page visibility changes
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        updateOnlineStatus(false);
        clearInterval(interval);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        supabase.removeChannel(subscription);
      };
    }

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, user]);

  const fetchOnlineStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("online_status")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setIsOnline(data?.online_status || false);
    } catch (error) {
      console.error("Error fetching online status:", error);
    }
  };

  const updateOnlineStatus = async (status: boolean) => {
    try {
      await supabase
        .from("users")
        .update({
          online_status: status,
          last_active: new Date().toISOString(),
        })
        .eq("id", userId);
    } catch (error) {
      console.error("Error updating online status:", error);
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      updateOnlineStatus(true);
    } else {
      updateOnlineStatus(false);
    }
  };

  return (
    <div
      className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-300"} ${className}`}
      title={isOnline ? "Online" : "Offline"}
    />
  );
}
