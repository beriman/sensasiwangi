import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  MessageSquare, 
  ThumbsUp, 
  Award, 
  Flag,
  Reply,
  Calendar,
  Clock,
  Pin
} from "lucide-react";

interface ForumThreadDetailProps {
  threadId: string;
}

interface ThreadData {
  id: string;
  title: string;
  content: string;
  user_id: string;
  category_id: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  is_solved: boolean;
  view_count: number;
  reply_count: number;
  vote_count: number;
  user: {
    username: string;
    avatar_url: string | null;
    exp: number;
    level: number;
  };
  category: {
    name: string;
  };
}

interface ReplyData {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_solution: boolean;
  vote_count: number;
  user: {
    username: string;
    avatar_url: string | null;
    exp: number;
    level: number;
  };
}

export default function ForumThreadDetail({ threadId }: ForumThreadDetailProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [replies, setReplies] = useState<ReplyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchThreadDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch thread details
        const { data: threadData, error: threadError } = await supabase
          .from("forum_threads")
          .select(`
            id,
            title,
            content,
            user_id,
            category_id,
            created_at,
            updated_at,
            is_pinned,
            is_solved,
            view_count,
            reply_count,
            vote_count,
            user:user_id (username, avatar_url, exp, level),
            category:category_id (name)
          `)
          .eq("id", threadId)
          .single();
        
        if (threadError) throw threadError;
        
        // Fetch replies
        const { data: replyData, error: replyError } = await supabase
          .from("forum_replies")
          .select(`
            id,
            content,
            user_id,
            created_at,
            updated_at,
            is_solution,
            vote_count,
            user:user_id (username, avatar_url, exp, level)
          `)
          .eq("thread_id", threadId)
          .order("created_at", { ascending: true });
        
        if (replyError) throw replyError;
        
        setThread(threadData);
        setReplies(replyData || []);
        
        // Increment view count
        if (user) {
          await supabase
            .from("forum_threads")
            .update({ view_count: (threadData.view_count || 0) + 1 })
            .eq("id", threadId);
        }
      } catch (error) {
        console.error("Error fetching thread details:", error);
        toast({
          title: "Error",
          description: "Failed to load thread details. Please try again.",
          variant: "destructive",
        });
        navigate("/forum");
      } finally {
        setLoading(false);
      }
    };
    
    fetchThreadDetails();
  }, [threadId, user, navigate, toast]);

  const handleSubmitReply = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/forum/thread/${threadId}` } });
      return;
    }
    
    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "Reply content cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Insert reply
      const { data, error } = await supabase
        .from("forum_replies")
        .insert({
          thread_id: threadId,
          user_id: user.id,
          content: replyContent,
        })
        .select();
      
      if (error) throw error;
      
      // Update thread's reply count and last reply info
      await supabase
        .from("forum_threads")
        .update({
          reply_count: (thread?.reply_count || 0) + 1,
          last_reply_at: new Date().toISOString(),
          last_reply_user_id: user.id,
        })
        .eq("id", threadId);
      
      // Add the new reply to the list
      if (data && data[0]) {
        const newReply: ReplyData = {
          ...data[0],
          vote_count: 0,
          user: {
            username: user.user_metadata?.username || user.email?.split("@")[0] || "User",
            avatar_url: user.user_metadata?.avatar_url || null,
            exp: 0,
            level: 1,
          },
        };
        
        setReplies([...replies, newReply]);
      }
      
      // Clear the reply input
      setReplyContent("");
      
      toast({
        title: "Success",
        description: "Your reply has been posted.",
      });
    } catch (error) {
      console.error("Error posting reply:", error);
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Thread not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Thread */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex">
            {/* Author info */}
            <div className="flex-shrink-0 w-40 mr-6 text-center">
              <Avatar className="h-20 w-20 mx-auto mb-2">
                <AvatarImage 
                  src={thread.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${thread.user_id}`} 
                  alt={thread.user.username} 
                />
                <AvatarFallback>{thread.user.username[0]}</AvatarFallback>
              </Avatar>
              <div className="font-medium">{thread.user.username}</div>
              <div className="text-xs text-gray-500 mb-2">
                Level {thread.user.level}
              </div>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                {thread.user.exp} XP
              </Badge>
            </div>
            
            {/* Thread content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {thread.category.name}
                </Badge>
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
              
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Calendar className="h-4 w-4 mr-1" />
                <span className="mr-4">
                  Posted on {new Date(thread.created_at).toLocaleDateString()}
                </span>
                
                <Clock className="h-4 w-4 mr-1" />
                <span>
                  Last updated {new Date(thread.updated_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="prose max-w-none mb-4" dangerouslySetInnerHTML={{ __html: thread.content }} />
              
              <div className="flex items-center gap-4 mt-6">
                <Button variant="outline" size="sm" className="gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  Upvote ({thread.vote_count})
                </Button>
                
                <Button variant="outline" size="sm" className="gap-1 text-red-600">
                  <Flag className="h-4 w-4" />
                  Report
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Replies */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
          Replies ({replies.length})
        </h3>
        
        {replies.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-500">No replies yet. Be the first to reply!</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => (
              <Card key={reply.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex">
                    {/* Author info */}
                    <div className="flex-shrink-0 w-40 mr-6 text-center">
                      <Avatar className="h-16 w-16 mx-auto mb-2">
                        <AvatarImage 
                          src={reply.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.user_id}`} 
                          alt={reply.user.username} 
                        />
                        <AvatarFallback>{reply.user.username[0]}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{reply.user.username}</div>
                      <div className="text-xs text-gray-500 mb-2">
                        Level {reply.user.level}
                      </div>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {reply.user.exp} XP
                      </Badge>
                    </div>
                    
                    {/* Reply content */}
                    <div className="flex-1">
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>
                          Posted on {new Date(reply.created_at).toLocaleDateString()}
                        </span>
                        
                        {reply.is_solution && (
                          <Badge className="ml-4 bg-green-100 text-green-800">
                            <Award className="h-3 w-3 mr-1" />
                            Solution
                          </Badge>
                        )}
                      </div>
                      
                      <div className="prose max-w-none mb-4" dangerouslySetInnerHTML={{ __html: reply.content }} />
                      
                      <div className="flex items-center gap-4 mt-6">
                        <Button variant="outline" size="sm" className="gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          Upvote ({reply.vote_count})
                        </Button>
                        
                        <Button variant="outline" size="sm" className="gap-1">
                          <Reply className="h-4 w-4" />
                          Quote
                        </Button>
                        
                        <Button variant="outline" size="sm" className="gap-1 text-red-600">
                          <Flag className="h-4 w-4" />
                          Report
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Reply form */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Post a Reply</h3>
          
          {user ? (
            <div className="space-y-4">
              <Textarea
                placeholder="Write your reply here..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={6}
                className="resize-y"
              />
              
              <div className="flex justify-end">
                <Button onClick={handleSubmitReply} disabled={submitting}>
                  {submitting ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Post Reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">You need to be logged in to reply.</p>
              <Button onClick={() => navigate("/login", { state: { from: `/forum/thread/${threadId}` } })}>
                Log In to Reply
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
