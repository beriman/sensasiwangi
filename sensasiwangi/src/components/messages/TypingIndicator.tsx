// @ts-ignore
import React, { useEffect, useState } from "react";
// @ts-ignore
import { supabase } from "../../lib/supabase";
// @ts-ignore
import { useAuth } from "../../lib/auth-provider";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";

interface TypingUser {
  id: string;
  full_name?: string;
  avatar_url?: string;
}

interface TypingIndicatorProps {
  conversationId: string;
}

export default function TypingIndicator({
  conversationId,
}: TypingIndicatorProps) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    if (!user || !conversationId) return;

    // Subscribe to typing status changes
    const subscription = supabase
      .channel(`typing_${conversationId}`)
      .on(
        "broadcast",
        { event: "typing" },
        (payload) => {
          if (payload.payload.user_id === user.id) return;

          const typingUser = payload.payload as TypingUser;
          
          // Add user to typing users
          setTypingUsers((prev) => {
            if (prev.some((u) => u.id === typingUser.id)) {
              return prev;
            }
            return [...prev, typingUser];
          });

          // Remove user after 3 seconds of inactivity
          setTimeout(() => {
            setTypingUsers((prev) => 
              prev.filter((u) => u.id !== typingUser.id)
            );
          }, 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [conversationId, user]);

  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500">
      <div className="flex -space-x-2">
        {typingUsers.slice(0, 3).map((typingUser) => (
          <Avatar key={typingUser.id} className="h-6 w-6 border border-white">
            <AvatarImage
              src={
                typingUser.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${typingUser.id}`
              }
              alt={typingUser.full_name || ""}
            />
            <AvatarFallback className="text-[10px]">
              {typingUser.full_name?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="flex items-center">
        <span>
          {typingUsers.length === 1
            ? `${typingUser.full_name || "Seseorang"} sedang mengetik`
            : `${typingUsers.length} orang sedang mengetik`}
        </span>
        <span className="ml-1 flex">
          <span className="animate-bounce">.</span>
          <span className="animate-bounce animation-delay-200">.</span>
          <span className="animate-bounce animation-delay-400">.</span>
        </span>
      </div>
    </div>
  );
}


