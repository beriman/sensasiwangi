// @ts-ignore
import React, { useEffect, useState } from "react";
// @ts-ignore
import { Link } from "react-router-dom";
// @ts-ignore
import { Card, CardContent } from "../../components/ui/card";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { MessageSquare, ThumbsUp, ThumbsDown, Bookmark } from "lucide-react";
// @ts-ignore
import { useAuth } from "../../../supabase/auth";
// @ts-ignore
import { supabase } from "../../../supabase/supabase";
// @ts-ignore
import { formatDistanceToNow } from "date-fns";
// @ts-ignore
import { ForumThread } from "../../types/forum";

export default function BookmarkedThreads() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchBookmarkedThreads = async () => {
      try {
        setLoading(true);

        // In a real implementation, we would fetch from the database
        // For now, we'll use mock data
        const mockBookmarks: ForumThread[] = [
          {
            id: "1",
            title: "Best jasmine notes for summer fragrances",
            content:
              "I'm looking for recommendations on jasmine notes that work well in summer fragrances...",
            user_id: "user1",
            category_id: "cat1",
            created_at: new Date(
              Date.now() - 1000 * 60 * 60 * 24 * 2,
            ).toISOString(),
            updated_at: new Date(
              Date.now() - 1000 * 60 * 60 * 24 * 2,
            ).toISOString(),
            user: {
              full_name: "Jane Smith",
              avatar_url:
                "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
              exp: 120,
            },
            vote_count: {
              cendol: 15,
              bata: 2,
            },
            reply_count: 8,
          },
          {
            id: "2",
            title: "How to create your first perfume blend",
            content:
              "A step-by-step guide for beginners looking to create their first perfume blend...",
            user_id: "user2",
            category_id: "cat2",
            created_at: new Date(
              Date.now() - 1000 * 60 * 60 * 24 * 5,
            ).toISOString(),
            updated_at: new Date(
              Date.now() - 1000 * 60 * 60 * 24 * 5,
            ).toISOString(),
            user: {
              full_name: "John Doe",
              avatar_url:
                "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
              exp: 350,
            },
            vote_count: {
              cendol: 42,
              bata: 3,
            },
            reply_count: 23,
          },
          {
            id: "3",
            title: "Citrus notes that last longer",
            content:
              "Citrus notes are known to be fleeting. Here are some that last longer...",
            user_id: "user3",
            category_id: "cat1",
            created_at: new Date(
              Date.now() - 1000 * 60 * 60 * 24 * 10,
            ).toISOString(),
            updated_at: new Date(
              Date.now() - 1000 * 60 * 60 * 24 * 10,
            ).toISOString(),
            user: {
              full_name: "Alex Johnson",
              avatar_url:
                "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
              exp: 210,
            },
            vote_count: {
              cendol: 28,
              bata: 5,
            },
            reply_count: 15,
          },
        ];

        setBookmarks(mockBookmarks);
      } catch (error) {
        console.error("Error fetching bookmarked threads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedThreads();
  }, [user]);

  const removeBookmark = (threadId: string) => {
    // In a real implementation, this would remove the bookmark from the database
    setBookmarks(bookmarks.filter((thread) => thread.id !== threadId));
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-6">
          <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No bookmarked threads</p>
          <p className="text-sm text-gray-400 mt-1">
            Bookmark threads to save them for later
          </p>
          <Link to="/forum">
            <Button className="mt-4">Browse Forum</Button>
          </Link>
        </div>
      ) : (
        <>
          {bookmarks.map((thread) => (
            <Card key={thread.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <Link to={`/forum/thread/${thread.id}`} className="flex-1">
                    <h3 className="font-medium text-lg hover:text-purple-600 transition-colors">
                      {thread.title}
                    </h3>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => removeBookmark(thread.id)}
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                  {thread.content}
                </p>

                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={thread.user?.avatar_url}
                        alt={thread.user?.full_name}
                      />
                      <AvatarFallback>
                        {thread.user?.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-gray-500">
                      {thread.user?.full_name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(thread.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-gray-500">
                        {thread.vote_count?.cendol || 0}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ThumbsDown className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-gray-500">
                        {thread.vote_count?.bata || 0}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-gray-500">
                        {thread.reply_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="pt-2 text-center">
            <Button variant="outline" size="sm">
              View More Bookmarks
            </Button>
          </div>
        </>
      )}
    </div>
  );
}


