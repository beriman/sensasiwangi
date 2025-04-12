// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import TopNavigation from "../dashboard/layout/TopNavigation";
// @ts-ignore
import Sidebar from "../dashboard/layout/Sidebar";
// @ts-ignore
import UserProfileCard from "../dashboard/UserProfileCard";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// @ts-ignore
import { Link } from "react-router-dom";
// @ts-ignore
import { RefreshCw, Settings, MessageSquare, ShoppingBag, Award, Users, Bookmark, Crown } from "lucide-react";
// @ts-ignore
import { useAuth } from "../../lib/auth-provider";
// @ts-ignore
import { cn } from "../../lib/utils";
// @ts-ignore
import ExpCard from "../profile/ExpCard";
// @ts-ignore
import BadgeCollection from "../profile/BadgeCollection";
// @ts-ignore
import FollowSection from "../profile/FollowSection";
// @ts-ignore
import BookmarkedThreads from "../profile/BookmarkedThreads";
// @ts-ignore
import MainLayout from "../layout/MainLayout";

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Function to trigger loading state for demonstration
  const handleRefresh = () => {
    setLoading(true);
    // Reset loading after 2 seconds
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <MainLayout withPadding={false} fullWidth={true}>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="container mx-auto px-6 pt-4 pb-2 flex justify-end gap-2">
            {user?.user_metadata?.role === "admin" && (
              <Button
                as={Link}
                to="/admin"
                className="bg-purple-500 hover:bg-purple-600 text-white rounded-full px-4 h-9 shadow-sm transition-colors flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Admin Panel
              </Button>
            )}
            <Button
              onClick={handleRefresh}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4 h-9 shadow-sm transition-colors flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Loading..." : "Refresh Dashboard"}
            </Button>
          </div>
          <div
            className={cn(
              "container mx-auto p-6 space-y-8",
              "transition-all duration-300 ease-in-out",
            )}
          >
            {/* Profile and Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-1">
                <UserProfileCard />
              </div>
              <div className="md:col-span-2">
                <ExpCard userId={user?.id || ""} />
              </div>
            </div>

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Badge Collection */}
              <BadgeCollection userId={user?.id || ""} />

              {/* Connections */}
              <FollowSection userId={user?.id || ""} />
            </div>

            {/* Quick Access Section */}
            <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base font-medium text-gray-900">
                  Quick Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link to="/forum">
                    <Button
                      variant="outline"
                      className="w-full h-24 flex flex-col items-center justify-center gap-2 border-gray-200 hover:border-purple-200 hover:bg-purple-50"
                    >
                      <MessageSquare className="h-6 w-6 text-purple-500" />
                      <span className="text-sm font-medium">Forum</span>
                    </Button>
                  </Link>

                  <Link to="/marketplace">
                    <Button
                      variant="outline"
                      className="w-full h-24 flex flex-col items-center justify-center gap-2 border-gray-200 hover:border-blue-200 hover:bg-blue-50"
                    >
                      <ShoppingBag className="h-6 w-6 text-blue-500" />
                      <span className="text-sm font-medium">Marketplace</span>
                    </Button>
                  </Link>

                  <Link to="/profile">
                    <Button
                      variant="outline"
                      className="w-full h-24 flex flex-col items-center justify-center gap-2 border-gray-200 hover:border-green-200 hover:bg-green-50"
                    >
                      <Users className="h-6 w-6 text-green-500" />
                      <span className="text-sm font-medium">Community</span>
                    </Button>
                  </Link>

                  <Link to="/profile?tab=bookmarks">
                    <Button
                      variant="outline"
                      className="w-full h-24 flex flex-col items-center justify-center gap-2 border-gray-200 hover:border-amber-200 hover:bg-amber-50"
                    >
                      <Bookmark className="h-6 w-6 text-amber-500" />
                      <span className="text-sm font-medium">Bookmarks</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Bookmarked Threads */}
            <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base font-medium text-gray-900 flex items-center">
                  <Bookmark className="h-5 w-5 mr-2 text-amber-500" />
                  Bookmarked Threads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BookmarkedThreads limit={5} />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </MainLayout>
  );
};

export default Dashboard;


