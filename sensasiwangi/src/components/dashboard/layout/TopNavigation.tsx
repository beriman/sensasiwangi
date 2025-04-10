import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Home,
  MessageSquare,
  Search,
  Settings,
  User,
  Award,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../../supabase/auth";
import NotificationCenter from "@/components/forum/NotificationCenter";
import UnreadMessagesIndicator from "@/components/messages/UnreadMessagesIndicator";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "../../../../supabase/supabase";
import { calculateLevelProgress } from "@/lib/reputation";

interface TopNavigationProps {
  onSearch?: (query: string) => void;
}

const TopNavigation = ({ onSearch = () => {} }: TopNavigationProps) => {
  const { user, signOut } = useAuth();
  const [userExp, setUserExp] = useState(0);
  const [userLevel, setUserLevel] = useState(1);

  useEffect(() => {
    if (!user) return;

    const fetchUserExp = async () => {
      const { data } = await supabase
        .from("users")
        .select("exp")
        .eq("id", user.id)
        .single();

      if (data) {
        setUserExp(data.exp || 0);
        const { currentLevel } = calculateLevelProgress(data.exp || 0);
        setUserLevel(currentLevel.level);
      }
    };

    fetchUserExp();
  }, [user]);

  if (!user) return null;

  return (
    <div className="w-full h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 fixed top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <Link
          to="/"
          className="text-gray-900 hover:text-gray-700 transition-colors"
        >
          <Home className="h-5 w-5" />
        </Link>
        <div className="relative w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects..."
            className="pl-9 h-10 rounded-full bg-gray-100 border-0 text-sm focus:ring-2 focus:ring-gray-200 focus-visible:ring-gray-200 focus-visible:ring-offset-0"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                <Award className="h-4 w-4 text-purple-500" />
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                  Level {userLevel}
                </Badge>
                <span className="text-xs text-gray-600">{userExp} EXP</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">Your Reputation</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <NotificationCenter />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/messages" className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                >
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                </Button>
                <UnreadMessagesIndicator className="absolute -top-1 -right-1" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom">Messages</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 hover:cursor-pointer">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                alt={user.email || ""}
              />
              <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="rounded-xl border-none shadow-lg"
          >
            <DropdownMenuLabel className="text-xs text-gray-500">
              {user.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link to="/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => signOut()}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TopNavigation;
