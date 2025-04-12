// @ts-ignore
import React from "react";
// @ts-ignore
import { CornerUpLeft } from "lucide-react";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
// @ts-ignore
import { PrivateMessage } from "../../types/messages";
// @ts-ignore
import DOMPurify from "dompurify";

interface MessageReplyProps {
  replyToMessage: PrivateMessage;
  onClick?: () => void;
  compact?: boolean;
}

export default function MessageReply({
  replyToMessage,
  onClick,
  compact = false,
}: MessageReplyProps) {
  // Extract plain text from HTML content for preview
  const getTextPreview = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = DOMPurify.sanitize(html);
    let text = div.textContent || div.innerText || "";
    if (text.length > 60) {
      text = text.substring(0, 57) + "...";
    }
    return text;
  };

  // Check if message contains an image
  const hasImage = replyToMessage.content.includes("<img");

  // Check if message contains a product share
  const hasProductShare = replyToMessage.content.includes("data-product-share");

  // Get message type label
  const getMessageTypeLabel = () => {
    if (hasProductShare) return "Produk";
    if (hasImage) return "Gambar";
    return "";
  };

  if (compact) {
    return (
      <div
        className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer hover:text-gray-700"
        onClick={onClick}
      >
        <CornerUpLeft className="h-3 w-3" />
        <span className="truncate max-w-[150px]">
          {getTextPreview(replyToMessage.content)}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-start gap-2 p-2 bg-gray-50 rounded-md border-l-2 border-gray-300 mb-2 cursor-pointer hover:bg-gray-100"
      onClick={onClick}
    >
      <CornerUpLeft className="h-3 w-3 text-gray-400 mt-1 flex-shrink-0" />
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <Avatar className="h-5 w-5 flex-shrink-0">
          <AvatarImage
            src={
              replyToMessage.sender?.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${replyToMessage.sender_id}`
            }
            alt={replyToMessage.sender?.full_name || ""}
          />
          <AvatarFallback className="text-[8px]">
            {replyToMessage.sender?.full_name?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium truncate">
              {replyToMessage.sender?.full_name || "Pengguna"}
            </p>
            {(hasImage || hasProductShare) && (
              <span className="text-[10px] text-gray-500 bg-gray-200 px-1 rounded">
                {getMessageTypeLabel()}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 truncate">
            {getTextPreview(replyToMessage.content)}
          </p>
        </div>
      </div>
    </div>
  );
}


