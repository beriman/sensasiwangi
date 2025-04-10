import React from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, MessageSquare, Heart, Award, AtSign } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface NotificationItemProps {
  id: string;
  type: "reply" | "like" | "mention" | "level_up" | "badge";
  content: string;
  threadId?: string;
  threadTitle?: string;
  createdAt: string;
  isRead: boolean;
  userId?: string;
  userAvatar?: string;
  userName?: string;
  onMarkAsRead?: (id: string) => void;
}

export default function NotificationItem({
  id,
  type,
  content,
  threadId,
  threadTitle,
  createdAt,
  isRead,
  userId,
  userAvatar,
  userName,
  onMarkAsRead,
}: NotificationItemProps) {
  const getIcon = () => {
    switch (type) {
      case "reply":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "mention":
        return <AtSign className="h-4 w-4 text-green-500" />;
      case "level_up":
        return <Award className="h-4 w-4 text-yellow-500" />;
      case "badge":
        return <Award className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleClick = () => {
    if (!isRead && onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  return (
    <div
      className={cn(
        "flex items-start space-x-4 p-3 rounded-lg transition-colors",
        isRead ? "bg-white" : "bg-blue-50",
        !isRead && "hover:bg-blue-100",
      )}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-1">{getIcon()}</div>

      <div className="flex-grow">
        <div className="flex items-center space-x-2 mb-1">
          {userId && (
            <Link to={`/profile/${userId}`}>
              <Avatar className="h-6 w-6 cursor-pointer hover:ring-2 hover:ring-purple-300 transition-all">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback>{userName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </Link>
          )}
          <span className="text-sm font-medium text-gray-900">
            {userName || "System"}
          </span>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
        </div>

        <p className="text-sm text-gray-700">{content}</p>

        {threadId && threadTitle && (
          <Link
            to={`/forum/thread/${threadId}`}
            className="text-xs text-purple-600 hover:underline mt-1 inline-block"
          >
            {threadTitle.length > 50
              ? `${threadTitle.substring(0, 50)}...`
              : threadTitle}
          </Link>
        )}
      </div>

      {!isRead && (
        <div className="flex-shrink-0">
          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
        </div>
      )}
    </div>
  );
}
