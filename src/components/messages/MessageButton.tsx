import React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createConversation } from "@/lib/messages";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";

interface MessageButtonProps {
  userId: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  label?: string;
}

export default function MessageButton({
  userId,
  variant = "outline",
  size = "sm",
  className = "",
  showIcon = true,
  label = "Kirim Pesan",
}: MessageButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleClick = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to send messages",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      const conversation = await createConversation([user.id, userId]);
      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      {showIcon && <MessageSquare className="h-4 w-4 mr-2" />}
      {label}
    </Button>
  );
}
