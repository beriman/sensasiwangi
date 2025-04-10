import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "lucide-react";
import { useAuth } from "../../lib/auth-provider";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "../../lib/supabase";
import { Sambatan, SambatanParticipant } from "@/types/marketplace";

interface SambatanChatButtonProps {
  sambatan: Sambatan;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function SambatanChatButton({
  sambatan,
  className = "",
  variant = "outline",
  size = "default",
}: SambatanChatButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleChat = async () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk menggunakan fitur chat.",
        variant: "destructive",
      });
      navigate("/login?redirect=/messages");
      return;
    }

    try {
      setLoading(true);

      // Check if user is a participant in this sambatan
      const isParticipant = sambatan.participants?.some(
        (p) => p.participant_id === user.id
      );

      const isInitiator = sambatan.initiator_id === user.id;

      if (!isParticipant && !isInitiator) {
        toast({
          title: "Akses Ditolak",
          description: "Anda harus menjadi peserta Sambatan untuk mengakses chat.",
          variant: "destructive",
        });
        return;
      }

      // Check if a group conversation for this sambatan already exists
      const { data: existingConversation, error: conversationError } = await supabase
        .from("sambatan_group_conversations")
        .select("conversation_id")
        .eq("sambatan_id", sambatan.id)
        .single();

      if (conversationError && conversationError.code !== "PGRST116") {
        throw conversationError;
      }

      let conversationId;

      if (existingConversation) {
        // Use existing conversation
        conversationId = existingConversation.conversation_id;
      } else {
        // Create a new group conversation
        const { data: newConversation, error: createError } = await supabase
          .from("private_conversations")
          .insert({
            is_group: true,
            title: `Sambatan: ${sambatan.product?.name || "Produk"}`,
            created_by: user.id,
          })
          .select()
          .single();

        if (createError) throw createError;
        
        conversationId = newConversation.id;

        // Link the conversation to the sambatan
        await supabase
          .from("sambatan_group_conversations")
          .insert({
            sambatan_id: sambatan.id,
            conversation_id: conversationId,
          });

        // Add all participants to the conversation
        const participants = [
          // Add initiator
          {
            conversation_id: conversationId,
            user_id: sambatan.initiator_id,
          },
          // Add all other participants
          ...(sambatan.participants || []).map((p) => ({
            conversation_id: conversationId,
            user_id: p.participant_id,
          })),
        ];

        // Filter out duplicates
        const uniqueParticipants = participants.filter(
          (p, index, self) =>
            index === self.findIndex((t) => t.user_id === p.user_id)
        );

        // Insert participants
        await supabase
          .from("private_conversation_participants")
          .insert(uniqueParticipants);

        // Add system message
        await supabase.from("private_messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: `<p>Selamat datang di grup chat Sambatan untuk ${
            sambatan.product?.name || "produk ini"
          }! Gunakan grup ini untuk berkomunikasi dengan semua peserta Sambatan.</p>`,
          is_system_message: true,
        });
      }

      // Navigate to the conversation
      navigate(`/messages/${conversationId}`);
    } catch (error) {
      console.error("Error creating/accessing sambatan chat:", error);
      toast({
        title: "Error",
        description: "Gagal membuka chat Sambatan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleChat}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <MessageSquare className="h-4 w-4 mr-2" />
      )}
      Chat Grup Sambatan
    </Button>
  );
}
