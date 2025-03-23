import React, { useState, useEffect } from "react";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import DashboardGrid from "../dashboard/DashboardGrid";
import UserExpCard from "../dashboard/UserExpCard";
import UserProfileCard from "../dashboard/UserProfileCard";
import TaskBoard from "../dashboard/TaskBoard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { RefreshCw, Settings } from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { cn } from "@/lib/utils";

const Home = () => {
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
    <div className="min-h-screen bg-[#f5f5f7]">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar />
        <main className="flex-1 overflow-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-1">
                <UserProfileCard />
              </div>
              <div className="md:col-span-1">
                <UserExpCard />
              </div>
              <div className="md:col-span-1">
                <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden h-full">
                  <CardHeader>
                    <CardTitle className="text-base font-medium text-gray-900">
                      Forum Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <Link to="/forum" className="inline-block">
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90">
                          Go to Forum
                        </Button>
                      </Link>
                      <p className="mt-4 text-sm text-gray-500">
                        Join discussions, create threads, and earn experience
                        points
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <DashboardGrid isLoading={loading} />
            <TaskBoard isLoading={loading} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
