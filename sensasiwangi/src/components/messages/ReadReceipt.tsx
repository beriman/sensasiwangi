import React from "react";
import { Check } from "lucide-react";
import { ConversationParticipant } from "@/types/messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReadReceiptProps {
  messageId: string;
  messageTimestamp: string;
  participants: ConversationParticipant[];
  isGroup?: boolean;
}

export default function ReadReceipt({
  messageId,
  messageTimestamp,
  participants,
  isGroup = false,
}: ReadReceiptProps) {
  // Filter participants who have read the message
  const readParticipants = participants.filter((participant) => {
    if (!participant.last_read_at) return false;
    return new Date(participant.last_read_at) >= new Date(messageTimestamp);
  });

  // If no one has read the message, show a single check mark
  if (readParticipants.length === 0) {
    return (
      <div className="text-gray-400">
        <Check className="h-3 w-3" />
      </div>
    );
  }

  // If it's not a group chat and someone has read the message, show double check mark
  if (!isGroup) {
    return (
      <div className="text-blue-500">
        <div className="relative">
          <Check className="h-3 w-3" />
          <Check className="h-3 w-3 absolute -left-1 top-0" />
        </div>
      </div>
    );
  }

  // For group chats, show avatars of who has read the message
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex -space-x-1">
            {readParticipants.slice(0, 3).map((participant) => (
              <Avatar
                key={participant.id}
                className="h-4 w-4 border border-white"
              >
                <AvatarImage
                  src={
                    participant.user?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.user_id}`
                  }
                  alt={participant.user?.full_name || ""}
                />
                <AvatarFallback className="text-[8px]">
                  {participant.user?.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            ))}
            {readParticipants.length > 3 && (
              <div className="h-4 w-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-medium">
                +{readParticipants.length - 3}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Dibaca oleh:{" "}
            {readParticipants
              .map((p) => p.user?.full_name || "Pengguna")
              .join(", ")}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
