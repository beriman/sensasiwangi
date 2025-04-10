import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  HelpCircle,
  FolderKanban,
  ShoppingBag,
  MessageSquare,
  Crown,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth-provider";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const mainNavItems: NavItem[] = [
    { icon: <Home size={20} />, label: "Home", href: "/" },
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/dashboard" },
    { icon: <ShoppingBag size={20} />, label: "Marketplace", href: "/marketplace" },
    { icon: <MessageSquare size={20} />, label: "Messages", href: "/messages" },
    { icon: <Users size={20} />, label: "Forum", href: "/forum" },
  ];

  const businessNavItems: NavItem[] = [
    { icon: <FolderKanban size={20} />, label: "Projects", href: "/dashboard/projects" },
    { icon: <Calendar size={20} />, label: "Calendar", href: "/dashboard/calendar" },
    { icon: <Users size={20} />, label: "Team", href: "/dashboard/team" },
  ];

  const bottomNavItems: NavItem[] = [
    { icon: <User size={20} />, label: "Profile", href: "/profile" },
    { icon: <Settings size={20} />, label: "Settings", href: "/settings" },
    { icon: <HelpCircle size={20} />, label: "Help", href: "/help" },
  ];

  // Check if current route is active
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="w-[280px] h-full bg-white/80 backdrop-blur-md border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-900 flex items-center">
          <Crown className="h-5 w-5 mr-2 text-amber-500" />
          Business Dashboard
        </h2>
        <p className="text-sm text-gray-500">
          Manage your business and projects
        </p>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1.5">
          {mainNavItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              asChild
              className={`w-full justify-start gap-3 h-10 rounded-xl text-sm font-medium ${
                isActive(item.href)
                  ? "bg-purple-50 text-purple-600 hover:bg-purple-100"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Link to={item.href}>
                <span
                  className={`${
                    isActive(item.href) ? "text-purple-600" : "text-gray-500"
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </Button>
          ))}
        </div>

        <Separator className="my-4 bg-gray-100" />

        <div className="space-y-3">
          <h3 className="text-xs font-medium px-4 py-1 text-gray-500 uppercase tracking-wider">
            Business Tools
          </h3>
          {businessNavItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              asChild
              className={`w-full justify-start gap-3 h-10 rounded-xl text-sm font-medium ${
                isActive(item.href)
                  ? "bg-purple-50 text-purple-600 hover:bg-purple-100"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Link to={item.href}>
                <span
                  className={`${
                    isActive(item.href) ? "text-purple-600" : "text-gray-500"
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </Button>
          ))}
        </div>

        <Separator className="my-4 bg-gray-100" />

        <div className="space-y-3">
          <h3 className="text-xs font-medium px-4 py-1 text-gray-500 uppercase tracking-wider">
            Filters
          </h3>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Active
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            High Priority
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
            In Progress
          </Button>
        </div>
      </ScrollArea>

      <div className="p-4 mt-auto border-t border-gray-200">
        {bottomNavItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            asChild
            className={`w-full justify-start gap-3 h-10 rounded-xl text-sm font-medium ${
              isActive(item.href)
                ? "bg-purple-50 text-purple-600 hover:bg-purple-100"
                : "text-gray-700 hover:bg-gray-100"
            } mb-1.5`}
          >
            <Link to={item.href}>
              <span
                className={`${
                  isActive(item.href) ? "text-purple-600" : "text-gray-500"
                }`}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
