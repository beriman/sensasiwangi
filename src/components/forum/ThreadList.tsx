import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsDown, ThumbsUp, Clock } from "lucide-react";
import { getThreadsByCategory } from "@/lib/forum";
import { ForumThread } from "@/types/forum";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import ForumSearch from "./ForumSearch";

export default function ThreadList() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchThreads = async () => {
      if (!categoryId) return;

      try {
        setLoading(true);
        const data = await getThreadsByCategory(categoryId);
        setThreads(data);

        // Set category name from the first thread if available
        if (data.length > 0 && data[0].category) {
          setCategoryName(data[0].category.name);
        } else {
          // Fallback based on ID
          setCategoryName(
            categoryId.includes("diskusi")
              ? "Diskusi Perfumer"
              : "Review Parfum",
          );
        }
      } catch (error) {
        console.error("Error fetching threads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, [categoryId]);

  const handleSearchResults = (results: ForumThread[]) => {
    setThreads(results);
    setIsSearching(results.length > 0 || results.length === 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Memuat thread..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{categoryName}</h2>
        <Link to={`/forum/new-thread/${categoryId}`}>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90">
            Buat Thread Baru
          </Button>
        </Link>
      </div>

      <ForumSearch
        onSearchResults={handleSearchResults}
        categoryId={categoryId}
      />

      {threads.length === 0 ? (
        <Card className="p-6 text-center bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl">
          <p className="text-gray-500">
            {isSearching
              ? "Tidak ada thread yang sesuai dengan pencarian Anda."
              : "Belum ada thread di kategori ini."}
          </p>
          <p className="mt-2 text-gray-500">
            {isSearching
              ? "Coba ubah kata kunci atau filter pencarian Anda."
              : "Jadilah yang pertama membuat thread!"}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => (
            <Link key={thread.id} to={`/forum/thread/${thread.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {thread.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatDistanceToNow(new Date(thread.created_at), {
                          addSuffix: true,
                          locale: id,
                        })}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="line-clamp-2 text-gray-600 mb-4">
                    {thread.content}
                  </div>
                  {thread.tags && thread.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {thread.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="text-xs"
                          style={{ color: tag.color, borderColor: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={
                            thread.user?.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${thread.user_id}`
                          }
                          alt={thread.user?.full_name || "User"}
                        />
                        <AvatarFallback>
                          {thread.user?.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {thread.user?.full_name || "User"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {thread.user?.exp || 0} EXP
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-500">
                          {thread.reply_count || 0}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <ThumbsUp className="h-4 w-4 text-green-500" />
                          <span className="ml-1 text-sm text-gray-700">
                            {thread.vote_count?.cendol || 0}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <ThumbsDown className="h-4 w-4 text-red-500" />
                          <span className="ml-1 text-sm text-gray-700">
                            {thread.vote_count?.bata || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
