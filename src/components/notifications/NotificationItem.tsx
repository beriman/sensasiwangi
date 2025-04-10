import React from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { 
  Award, 
  Trophy, 
  Star, 
  Bell, 
  CheckCircle,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NotificationData {
  id: string;
  user_id: string;
  type: "badge" | "achievement" | "challenge" | "leaderboard" | "level_up" | "system";
  title: string;
  message: string;
  icon?: string;
  color?: string;
  link?: string;
  is_read: boolean;
  data?: any;
  created_at: string;
}

interface NotificationItemProps {
  notification: NotificationData;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: NotificationItemProps) {
  const navigate = useNavigate();
  
  const getNotificationIcon = () => {
    // If notification has an emoji icon, use it
    if (notification.icon && notification.icon.length <= 2) {
      return <span className="text-lg">{notification.icon}</span>;
    }
    
    // Otherwise use an icon based on type
    switch (notification.type) {
      case "badge":
        return <Award className="h-5 w-5 text-purple-500" />;
      case "achievement":
        return <Trophy className="h-5 w-5 text-amber-500" />;
      case "challenge":
        return <Trophy className="h-5 w-5 text-green-500" />;
      case "leaderboard":
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case "level_up":
        return <Star className="h-5 w-5 text-yellow-500" />;
      case "system":
        return <Bell className="h-5 w-5 text-gray-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const getNotificationColor = () => {
    if (notification.color) return notification.color;
    
    switch (notification.type) {
      case "badge":
        return "bg-purple-100";
      case "achievement":
        return "bg-amber-100";
      case "challenge":
        return "bg-green-100";
      case "leaderboard":
        return "bg-blue-100";
      case "level_up":
        return "bg-yellow-100";
      case "system":
        return "bg-gray-100";
      default:
        return "bg-gray-100";
    }
  };
  
  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
  };
  
  return (
    <div 
      className={`p-4 border rounded-md mb-2 ${notification.is_read ? 'bg-white' : 'bg-blue-50'} ${notification.link ? 'cursor-pointer' : ''}`}
      onClick={notification.link ? handleClick : undefined}
    >
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getNotificationColor()}`}>
          {getNotificationIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{notification.title}</h3>
            <div className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          
          {!notification.is_read && (
            <Badge variant="outline" className="mt-2 bg-blue-100 text-blue-800">
              New
            </Badge>
          )}
          
          <div className="flex justify-end mt-2 gap-2">
            {!notification.is_read && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark as read
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
