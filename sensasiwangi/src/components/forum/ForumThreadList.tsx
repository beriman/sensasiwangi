// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import { Link, useNavigate } from "react-router-dom";
// @ts-ignore
import { Card, CardContent } from "../../components/ui/card";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
// @ts-ignore
import { supabase } from "../../lib/supabase";
// @ts-ignore
import { LoadingSpinner } from "../../components/ui/loading-spinner";
// @ts-ignore
import { useAuth } from "../../lib/auth-provider";
import { 
  MessageSquare, 
  Eye, 
  ThumbsUp, 
  Clock, 
  Pin, 
  Award, 
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

interface ForumThread {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  is_solved: boolean;
  view_count: number;
  reply_count: number;
  vote_count: number;
  last_reply_at: string | null;
  last_reply_user_id: string | null;
  user: {
    username: string;
    avatar_url: string | null;
  };
  last_reply_user?: {
    username: string;
    avatar_url: string | null;
  };
}

interface ForumThreadListProps {
  categoryId: string;
}

export default function ForumThreadList({ categoryId }: ForumThreadListProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState("latest");
  const [filter, setFilter] = useState("all");
  const pageSize = 10;

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        
        // Calculate pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        
        // Build query
        let query = supabase
          .from("forum_threads")
          .select(`
            id,
            title,
            user_id,
            created_at,
            updated_at,
            is_pinned,
            is_solved,
            view_count,
            reply_count,
            vote_count,
            last_reply_at,
            last_reply_user_id,
            user:user_id (username, avatar_url),
            last_reply_user:last_reply_user_id (username, avatar_url)
          `, { count: 'exact' })
          .eq("category_id", categoryId);
        
        // Apply filters
        if (filter === "solved") {
          query = query.eq("is_solved", true);
        } else if (filter === "unsolved") {
          query = query.eq("is_solved", false);
        }
        
        // Apply sorting
        if (sort === "latest") {
          query = query.order("is_pinned", { ascending: false }).order("updated_at", { ascending: false });
        } else if (sort === "oldest") {
          query = query.order("is_pinned", { ascending: false }).order("created_at", { ascending: true });
        } else if (sort === "most_viewed") {
          query = query.order("is_pinned", { ascending: false }).order("view_count", { ascending: false });
        } else if (sort === "most_replied") {
          query = query.order("is_pinned", { ascending: false }).order("reply_count", { ascending: false });
        } else if (sort === "most_voted") {
          query = query.order("is_pinned", { ascending: false }).order("vote_count", { ascending: false });
        }
        
        // Apply pagination
        query = query.range(from, to);
        
        const { data, count, error } = await query;
        
        if (error) throw error;
        
        setThreads(data || []);
        setTotalPages(Math.ceil((count || 0) / pageSize));
      } catch (error) {
        console.error("Error fetching threads:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchThreads();
  }, [categoryId, page, sort, filter]);

  const handleCreateThread = () => {
    if (!user) {
      // Redirect to login if not logged in
      navigate("/login", { state: { from: `/forum/category/${categoryId}` } });
      return;
    }
    
    navigate(`/forum/new-thread/${categoryId}`);
  };

  if (loading && page === 1) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Threads</SelectItem>
              <SelectItem value="solved">Solved Only</SelectItem>
              <SelectItem value="unsolved">Unsolved Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest Activity</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="most_viewed">Most Viewed</SelectItem>
              <SelectItem value="most_replied">Most Replies</SelectItem>
              <SelectItem value="most_voted">Most Votes</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleCreateThread}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Thread
          </Button>
        </div>
      </div>
      
      {/* Thread List */}
      {threads.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">No threads found in this category.</p>
          <Button onClick={handleCreateThread}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create the First Thread
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => (
            <Card key={thread.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <Link to={`/forum/thread/${thread.id}`} className="block">
                  <div className="flex items-start p-6">
                    <div className="flex-shrink-0 mr-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={thread.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${thread.user_id}`} 
                          alt={thread.user.username} 
                        />
                        <AvatarFallback>{thread.user.username[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {thread.is_pinned && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <Pin className="h-3 w-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                        {thread.is_solved && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Award className="h-3 w-3 mr-1" />
                            Solved
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {thread.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <span className="mr-2">by {thread.user.username}</span>
                        <span className="text-gray-400">•</span>
                        <span className="mx-2">
                          {new Date(thread.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          <span>{thread.reply_count} replies</span>
                        </div>
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          <span>{thread.view_count} views</span>
                        </div>
                        <div className="flex items-center">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          <span>{thread.vote_count} votes</span>
                        </div>
                      </div>
                    </div>
                    {thread.last_reply_at && (
                      <div className="flex-shrink-0 ml-4 text-right">
                        <div className="text-xs text-gray-500">Last reply</div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(thread.last_reply_at).toLocaleDateString()}
                        </div>
                        {thread.last_reply_user && (
                          <div className="text-xs text-gray-500">
                            by {thread.last_reply_user.username}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}


