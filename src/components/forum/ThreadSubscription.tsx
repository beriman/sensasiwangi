import React, { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";

interface ThreadSubscriptionProps {
  threadId: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function ThreadSubscription({
  threadId,
  className = "",
  variant = "outline",
  size = "sm"
}: ThreadSubscriptionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    } else {
      setLoading(false);
    }
  }, [user, threadId]);
  
  const checkSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc(
        'is_subscribed_to_thread',
        {
          user_id_param: user.id,
          thread_id_param: threadId
        }
      );
      
      if (error) throw error;
      
      setIsSubscribed(data);
    } catch (error) {
      console.error("Error checking subscription status:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to this thread",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      const { error } = await supabase.rpc(
        'subscribe_to_thread',
        {
          user_id_param: user.id,
          thread_id_param: threadId
        }
      );
      
      if (error) throw error;
      
      setIsSubscribed(true);
      
      toast({
        title: "Subscribed",
        description: "You will receive notifications for updates to this thread",
      });
    } catch (error) {
      console.error("Error subscribing to thread:", error);
      toast({
        title: "Error",
        description: "Failed to subscribe to thread",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleUnsubscribe = async () => {
    if (!user) return;
    
    try {
      setSubmitting(true);
      
      const { error } = await supabase.rpc(
        'unsubscribe_from_thread',
        {
          user_id_param: user.id,
          thread_id_param: threadId
        }
      );
      
      if (error) throw error;
      
      setIsSubscribed(false);
      
      toast({
        title: "Unsubscribed",
        description: "You will no longer receive notifications for this thread",
      });
    } catch (error) {
      console.error("Error unsubscribing from thread:", error);
      toast({
        title: "Error",
        description: "Failed to unsubscribe from thread",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }
  
  if (!user) {
    return null;
  }
  
  return isSubscribed ? (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleUnsubscribe}
      disabled={submitting}
    >
      {submitting ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <BellOff className="h-4 w-4 mr-2" />
      )}
      Unsubscribe
    </Button>
  ) : (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSubscribe}
      disabled={submitting}
    >
      {submitting ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Bell className="h-4 w-4 mr-2" />
      )}
      Subscribe
    </Button>
  );
}
