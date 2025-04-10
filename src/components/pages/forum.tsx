import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Routes, Route } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import ForumLayout from "@/components/forum/ForumLayout";
import ForumCategoryList from "@/components/forum/ForumCategoryList";
import ForumThreadList from "@/components/forum/ForumThreadList";
import ForumThreadDetail from "@/components/forum/ForumThreadDetail";
import ForumNewThread from "@/components/forum/ForumNewThread";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";

// Import new forum components
import ModerationDashboard from "@/components/forum/moderation/ModerationDashboard";
import TagManager from "@/components/forum/tags/TagManager";
import Leaderboard from "@/components/forum/gamification/Leaderboard";
import Challenges from "@/components/forum/gamification/Challenges";
import ForumAnalytics from "@/components/forum/analytics/ForumAnalytics";
import BadgeCollection from "@/components/forum/gamification/BadgeCollection";
import AchievementList from "@/components/forum/gamification/AchievementList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Tag, BarChart, Award, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Forum() {
  const { user, isAdmin, isModerator } = useAuth();
  const { categoryId, threadId, action, section } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");
  const [threadTitle, setThreadTitle] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      if (categoryId) {
        try {
          // Fetch category name
          const { data, error } = await supabase
            .from("forum_categories")
            .select("name")
            .eq("id", categoryId)
            .single();

          if (error) throw error;
          setCategoryName(data.name);
        } catch (error) {
          console.error("Error fetching category:", error);
          navigate("/forum");
        }
      }

      if (threadId) {
        try {
          // Fetch thread title
          const { data, error } = await supabase
            .from("forum_threads")
            .select("title")
            .eq("id", threadId)
            .single();

          if (error) throw error;
          setThreadTitle(data.title);
        } catch (error) {
          console.error("Error fetching thread:", error);
          navigate(categoryId ? `/forum/category/${categoryId}` : "/forum");
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [categoryId, threadId, navigate]);

  const renderContent = () => {
    if (loading) {
      return <LoadingScreen text="Loading forum..." />;
    }

    // Handle special sections
    if (section) {
      switch (section) {
        case "moderation":
          if (!isAdmin && !isModerator) {
            navigate("/forum");
            return <LoadingScreen text="Redirecting..." />;
          }
          return (
            <ForumLayout
              title="Forum Moderation"
              subtitle="Manage and moderate forum content"
            >
              <ModerationDashboard />
            </ForumLayout>
          );

        case "tags":
          if (!isAdmin && !isModerator) {
            navigate("/forum");
            return <LoadingScreen text="Redirecting..." />;
          }
          return (
            <ForumLayout
              title="Tag Management"
              subtitle="Manage forum tags and categories"
            >
              <TagManager />
            </ForumLayout>
          );

        case "leaderboard":
          return (
            <ForumLayout
              title="Community Leaderboard"
              subtitle="See top contributors in our community"
            >
              <Leaderboard />
            </ForumLayout>
          );

        case "challenges":
          return (
            <ForumLayout
              title="Community Challenges"
              subtitle="Participate in challenges to earn rewards"
            >
              <Challenges />
            </ForumLayout>
          );

        case "badges":
          return (
            <ForumLayout
              title="Badge Collection"
              subtitle="Collect badges by participating in the community"
            >
              <BadgeCollection />
            </ForumLayout>
          );

        case "achievements":
          return (
            <ForumLayout
              title="Achievements"
              subtitle="Complete achievements to earn rewards and recognition"
            >
              <AchievementList />
            </ForumLayout>
          );

        case "analytics":
          if (!isAdmin && !isModerator) {
            navigate("/forum");
            return <LoadingScreen text="Redirecting..." />;
          }
          return (
            <ForumLayout
              title="Forum Analytics"
              subtitle="View detailed forum statistics and trends"
            >
              <ForumAnalytics />
            </ForumLayout>
          );

        default:
          navigate("/forum");
          return <LoadingScreen text="Redirecting..." />;
      }
    }

    // New thread form
    if (action === "new-thread" && categoryId) {
      return (
        <ForumLayout
          title={`New Thread in ${categoryName}`}
          subtitle="Share your thoughts, questions, or ideas with the community"
        >
          <ForumNewThread categoryId={categoryId} />
        </ForumLayout>
      );
    }

    // Thread detail
    if (threadId) {
      return (
        <ForumLayout
          title={threadTitle}
          subtitle={categoryName ? `Posted in ${categoryName}` : undefined}
        >
          <ForumThreadDetail threadId={threadId} />
        </ForumLayout>
      );
    }

    // Thread list for a category
    if (categoryId) {
      return (
        <ForumLayout
          title={categoryName}
          subtitle="Browse threads in this category"
        >
          <ForumThreadList categoryId={categoryId} />
        </ForumLayout>
      );
    }

    // Category list (forum home)
    return (
      <ForumLayout
        title="Forum Komunitas"
        subtitle="Diskusikan dengan sesama penggemar wewangian dan bagikan pengetahuan Anda"
      >
        <div className="space-y-6">
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              {(isAdmin || isModerator) && (
                <TabsTrigger value="moderation">Moderation</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="categories">
              <ForumCategoryList />
            </TabsContent>

            <TabsContent value="leaderboard">
              <Leaderboard />
            </TabsContent>

            <TabsContent value="challenges">
              <Challenges />
            </TabsContent>

            <TabsContent value="badges">
              <BadgeCollection />
            </TabsContent>

            <TabsContent value="achievements">
              <AchievementList />
            </TabsContent>

            {(isAdmin || isModerator) && (
              <TabsContent value="moderation">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center gap-2"
                      onClick={() => navigate("/forum/section/moderation")}
                    >
                      <Shield className="h-8 w-8" />
                      <span>Moderation Dashboard</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center gap-2"
                      onClick={() => navigate("/forum/section/tags")}
                    >
                      <Tag className="h-8 w-8" />
                      <span>Tag Management</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center gap-2"
                      onClick={() => navigate("/forum/section/analytics")}
                    >
                      <BarChart className="h-8 w-8" />
                      <span>Forum Analytics</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center gap-2"
                      onClick={() => navigate("/forum/section/badges")}
                    >
                      <Award className="h-8 w-8" />
                      <span>Badge Management</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-24 flex flex-col items-center justify-center gap-2"
                      onClick={() => navigate("/forum/section/achievements")}
                    >
                      <Star className="h-8 w-8" />
                      <span>Achievements</span>
                    </Button>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </ForumLayout>
    );
  };

  return (
    <MainLayout>
      {renderContent()}
    </MainLayout>
  );
}
