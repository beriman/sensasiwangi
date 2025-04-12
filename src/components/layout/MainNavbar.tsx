import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-provider";
import {
  Droplet,
  Menu,
  X,
  User,
  MessageSquare,
  ShoppingBag,
  Settings,
  LogOut,
  Home,
  BookOpen,
  Crown,
  Bell,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { UnreadMessagesIndicator } from "@/components/messages/UnreadMessagesIndicator";

export default function MainNavbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userMembership, setUserMembership] = useState<"free" | "business">("free");
  const [isScrolled, setIsScrolled] = useState(false);

  // Check if current route is active
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  // Fetch user membership status
  useEffect(() => {
    const fetchUserMembership = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("users")
          .select("membership")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setUserMembership(data?.membership || "free");
      } catch (error) {
        console.error("Error fetching user membership:", error);
      }
    };

    fetchUserMembership();
  }, [user]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-200",
        isScrolled
          ? "bg-white shadow-sm"
          : "bg-[rgba(255,255,255,0.8)] backdrop-blur-md border-b border-[#f5f5f7]/30"
      )}
    >
      <div className="max-w-[1200px] mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="font-medium text-xl flex items-center">
            <Droplet className="h-6 w-6 mr-2 text-purple-600" />
            <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent font-bold">
              sensasiwangi.id
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-7 text-sm font-medium">
          <Link
            to="/"
            className={cn(
              "hover:text-purple-600 transition-colors",
              isActive("/") && !isActive("/forum") && !isActive("/marketplace") && !isActive("/profile") && !isActive("/dashboard")
                ? "text-purple-600"
                : "text-gray-700"
            )}
          >
            Beranda
          </Link>
          <Link
            to="/forum"
            className={cn(
              "hover:text-purple-600 transition-colors",
              isActive("/forum") ? "text-purple-600" : "text-gray-700"
            )}
          >
            Forum
          </Link>
          <Link
            to="/marketplace"
            className={cn(
              "hover:text-purple-600 transition-colors",
              isActive("/marketplace") ? "text-purple-600" : "text-gray-700"
            )}
          >
            Marketplace
          </Link>
          <Link
            to="/kelas"
            className={cn(
              "hover:text-purple-600 transition-colors",
              isActive("/kelas") ? "text-purple-600" : "text-gray-700"
            )}
          >
            Kelas
          </Link>
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-2">
          {/* Search Button */}
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <Search className="h-5 w-5 text-gray-600" />
          </Button>

          {user ? (
            <>
              {/* Notifications */}
              <NotificationCenter />

              {/* Messages */}
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

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 hover:cursor-pointer">
                    <AvatarImage
                      src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                      alt={user.email || ""}
                    />
                    <AvatarFallback>
                      {user.email?.[0].toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.user_metadata?.full_name || user.email}</span>
                      <span className="text-xs text-gray-500">{user.email}</span>
                      {userMembership === "business" && (
                        <Badge className="mt-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white border-0 w-fit">
                          <Crown className="h-3 w-3 mr-1" />
                          Business
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Profil Saya
                    </Link>
                  </DropdownMenuItem>
                  {userMembership === "business" && (
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <Crown className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/marketplace/my-shop" className="cursor-pointer">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Toko Saya
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/messages" className="cursor-pointer">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Pesan
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Pengaturan
                    </Link>
                  </DropdownMenuItem>
                  {user.user_metadata?.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Settings className="h-4 w-4 mr-2" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-sm">
                  Masuk
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="text-sm bg-purple-600 hover:bg-purple-700">
                  Daftar
                </Button>
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 rounded-full"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 text-gray-600" />
            ) : (
              <Menu className="h-5 w-5 text-gray-600" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-3 space-y-3">
            <Link
              to="/"
              className={cn(
                "block py-2 px-3 rounded-md hover:bg-gray-100",
                isActive("/") && !isActive("/forum") && !isActive("/marketplace") && !isActive("/profile") && !isActive("/dashboard")
                  ? "bg-purple-50 text-purple-600"
                  : ""
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Home className="h-4 w-4 inline-block mr-2" />
              Beranda
            </Link>
            <Link
              to="/forum"
              className={cn(
                "block py-2 px-3 rounded-md hover:bg-gray-100",
                isActive("/forum") ? "bg-purple-50 text-purple-600" : ""
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <BookOpen className="h-4 w-4 inline-block mr-2" />
              Forum
            </Link>
            <Link
              to="/marketplace"
              className={cn(
                "block py-2 px-3 rounded-md hover:bg-gray-100",
                isActive("/marketplace") ? "bg-purple-50 text-purple-600" : ""
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <ShoppingBag className="h-4 w-4 inline-block mr-2" />
              Marketplace
            </Link>
            <Link
              to="/kelas"
              className={cn(
                "block py-2 px-3 rounded-md hover:bg-gray-100",
                isActive("/kelas") ? "bg-purple-50 text-purple-600" : ""
              )}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <BookOpen className="h-4 w-4 inline-block mr-2" />
              Kelas
            </Link>

            {user && (
              <>
                <div className="border-t border-gray-100 my-2"></div>
                <Link
                  to="/profile"
                  className={cn(
                    "block py-2 px-3 rounded-md hover:bg-gray-100",
                    isActive("/profile") ? "bg-purple-50 text-purple-600" : ""
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4 inline-block mr-2" />
                  Profil Saya
                </Link>
                {userMembership === "business" && (
                  <Link
                    to="/dashboard"
                    className={cn(
                      "block py-2 px-3 rounded-md hover:bg-gray-100",
                      isActive("/dashboard") ? "bg-purple-50 text-purple-600" : ""
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Crown className="h-4 w-4 inline-block mr-2" />
                    Dashboard
                  </Link>
                )}
                <Link
                  to="/marketplace/my-shop"
                  className="block py-2 px-3 rounded-md hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <ShoppingBag className="h-4 w-4 inline-block mr-2" />
                  Toko Saya
                </Link>
                <Link
                  to="/messages"
                  className="block py-2 px-3 rounded-md hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <MessageSquare className="h-4 w-4 inline-block mr-2" />
                  Pesan
                </Link>
                <Link
                  to="/settings"
                  className="block py-2 px-3 rounded-md hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 inline-block mr-2" />
                  Pengaturan
                </Link>
                {user.user_metadata?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="block py-2 px-3 rounded-md hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 inline-block mr-2" />
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 px-3 rounded-md hover:bg-gray-100 text-red-600"
                >
                  <LogOut className="h-4 w-4 inline-block mr-2" />
                  Keluar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

