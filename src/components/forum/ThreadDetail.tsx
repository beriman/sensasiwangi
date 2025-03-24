import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import TagBadge from "./TagBadge";
import {
  ArrowLeft,
  Clock,
  Edit,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import {
  getThread,
  createReply,
  updateReply,
  deleteReply,
  vote,
  getUserVote,
} from "@/lib/forum";
import ThreadVote from "./ThreadVote";
import ReplyActions from "./ReplyActions";
import { ForumThread, ForumReply, VoteType } from "@/types/forum";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import RichTextContent from "./RichTextContent";
import RichTextEditor from "./RichTextEditor";

export default function ThreadDetail() {
  const { threadId } = useParams<{ threadId: string }>();
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userVote, setUserVote] = useState<VoteType | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyVotes, setReplyVotes] = useState<Record<string, VoteType | null>>(
    {},
  );

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchThread = async () => {
      if (!threadId) return;

      try {
        setLoading(true);
        const { thread: threadData, replies: repliesData } =
          await getThread(threadId);
        setThread(threadData);
        setReplies(repliesData);

        // Get user's vote on thread if logged in
        if (user) {
          const vote = await getUserVote(user.id, threadId);
          setUserVote(vote);

          // Get user's votes on replies
          const replyVotesObj: Record<string, VoteType | null> = {};
          for (const reply of repliesData) {
            const replyVote = await getUserVote(user.id, undefined, reply.id);
            replyVotesObj[reply.id] = replyVote;
          }
          setReplyVotes(replyVotesObj);
        }
      } catch (error) {
        console.error("Error fetching thread:", error);
        toast({
          title: "Error",
          description: "Failed to load thread. Please try again.",
          variant: "destructive",
        });
        navigate("/forum");
      } finally {
        setLoading(false);
      }
    };

    fetchThread();
  }, [threadId, user, toast, navigate]);

  const handleVote = async (voteType: VoteType) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to vote on threads.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!thread) return;

    try {
      const result = await vote(user.id, voteType, threadId);

      // Refresh thread data to get updated vote counts
      const { thread: updatedThread } = await getThread(threadId!);
      setThread(updatedThread);

      // Update user's vote state
      const newVote = await getUserVote(user.id, threadId);
      setUserVote(newVote);

      // Check for level up notification
      if (result.levelUp && result.levelUp.userId === thread.user_id) {
        toast({
          title: "Author Leveled Up!",
          description: `Thread author has leveled up from ${result.levelUp.oldLevel} to ${result.levelUp.newLevel}!`,
          variant: "default",
          className: "bg-gradient-to-r from-purple-600 to-pink-500 text-white",
        });
      }
    } catch (error) {
      console.error("Error voting on thread:", error);
      toast({
        title: "Error",
        description: "Failed to register vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReplyVote = async (replyId: string, voteType: VoteType) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to vote on replies.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      const result = await vote(user.id, voteType, undefined, replyId);

      // Refresh replies data to get updated vote counts
      const { replies: updatedReplies } = await getThread(threadId!);
      setReplies(updatedReplies);

      // Update user's vote state for this reply
      const newVote = await getUserVote(user.id, undefined, replyId);
      setReplyVotes((prev) => ({ ...prev, [replyId]: newVote }));

      // Check for level up notification
      const reply = replies.find((r) => r.id === replyId);
      if (result.levelUp && reply && result.levelUp.userId === reply.user_id) {
        toast({
          title: "Author Leveled Up!",
          description: `Reply author has leveled up from ${result.levelUp.oldLevel} to ${result.levelUp.newLevel}!`,
          variant: "default",
          className: "bg-gradient-to-r from-purple-600 to-pink-500 text-white",
        });
      }
    } catch (error) {
      console.error("Error voting on reply:", error);
      toast({
        title: "Error",
        description: "Failed to register vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to reply to threads.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!replyContent.trim()) {
      toast({
        title: "Empty Reply",
        description: "Reply content cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await createReply(replyContent, threadId!, user.id);
      setReplyContent("");
      toast({
        title: "Reply Posted",
        description: "Your reply has been posted successfully.",
      });

      // Refresh thread data to show new reply
      const { replies: updatedReplies } = await getThread(threadId!);
      setReplies(updatedReplies);
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

  const handleEditReply = (replyId: string, content: string) => {
    setEditingReplyId(replyId);
    setEditContent(content);
  };

  const handleCancelEdit = () => {
    setEditingReplyId(null);
    setEditContent("");
  };

  const handleUpdateReply = async (replyId: string) => {
    if (!editContent.trim()) {
      toast({
        title: "Empty Reply",
        description: "Reply content cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await updateReply(replyId, editContent, user!.id);
      toast({
        title: "Reply Updated",
        description: "Your reply has been updated successfully.",
      });

      // Refresh thread data to show updated reply
      const { replies: updatedReplies } = await getThread(threadId!);
      setReplies(updatedReplies);
      setEditingReplyId(null);
      setEditContent("");
    } catch (error) {
      console.error("Error updating reply:", error);
      toast({
        title: "Error",
        description: "Failed to update reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      await deleteReply(replyId, user!.id);
      toast({
        title: "Reply Deleted",
        description: "Your reply has been deleted successfully.",
      });

      // Refresh thread data to remove deleted reply
      const { replies: updatedReplies } = await getThread(threadId!);
      setReplies(updatedReplies);
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast({
        title: "Error",
        description: "Failed to delete reply. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Loading thread..." />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-800">
          Thread not found
        </h2>
        <p className="text-gray-600 mt-2">
          The thread you're looking for doesn't exist or has been removed.
        </p>
        <Button className="mt-4" asChild>
          <Link to="/forum">Back to Forum</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Link
          to={`/forum/category/${thread.category_id}`}
          className="flex items-center text-purple-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Threads
        </Link>
      </div>

      {/* Thread Card */}
      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl font-bold text-gray-900">
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
          <div className="prose max-w-none mb-4">
            <RichTextContent content={thread.content} />
          </div>

          {thread.tags && thread.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {thread.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} size="sm" />
              ))}
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
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

            <ThreadVote
              voteCount={thread.vote_count}
              userVote={userVote}
              onVote={handleVote}
            />
          </div>
        </CardContent>
      </Card>

      {/* Replies Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Replies ({replies.length})
        </h3>

        {replies.length === 0 ? (
          <Card className="p-6 text-center bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl">
            <p className="text-gray-500">
              No replies yet. Be the first to reply!
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => (
              <Card
                key={reply.id}
                className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden"
              >
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={
                            reply.user?.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.user_id}`
                          }
                          alt={reply.user?.full_name || "User"}
                        />
                        <AvatarFallback>
                          {reply.user?.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {reply.user?.full_name || "User"}
                        </p>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-500">
                            {reply.user?.exp || 0} EXP
                          </p>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(reply.created_at), {
                              addSuffix: true,
                              locale: id,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {editingReplyId === reply.id ? (
                    <div className="space-y-2">
                      <RichTextEditor
                        content={editContent}
                        onChange={setEditContent}
                        placeholder="Edit your reply..."
                        disabled={submitting}
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          disabled={submitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateReply(reply.id)}
                          disabled={submitting}
                        >
                          {submitting ? (
                            <>
                              <LoadingSpinner className="mr-2" />
                              Updating...
                            </>
                          ) : (
                            "Update Reply"
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose max-w-none mb-4">
                      <RichTextContent content={reply.content} />
                    </div>
                  )}

                  <div className="mt-4">
                    <ReplyActions
                      replyId={reply.id}
                      isAuthor={user?.id === reply.user_id}
                      userVote={replyVotes[reply.id] || null}
                      voteCount={reply.vote_count || { cendol: 0, bata: 0 }}
                      onVote={(voteType) => handleReplyVote(reply.id, voteType)}
                      onEdit={() => handleEditReply(reply.id, reply.content)}
                      onDelete={() => handleDeleteReply(reply.id)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reply Form */}
        {user ? (
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-gray-900">
                Add Your Reply
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReply} className="space-y-4">
                <RichTextEditor
                  content={replyContent}
                  onChange={setReplyContent}
                  placeholder="Write your reply here..."
                  disabled={submitting}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner className="mr-2" />
                        Posting...
                      </>
                    ) : (
                      "Post Reply"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-6 text-center bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl">
            <p className="text-gray-700 mb-2">Want to join the discussion?</p>
            <Button asChild>
              <Link to="/login">Login to Reply</Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
