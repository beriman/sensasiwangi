// @ts-ignore
import React, { useEffect, useState } from "react";
// @ts-ignore
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../../components/ui/card";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Textarea } from "../../components/ui/textarea";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { Input } from "../../components/ui/input";
// @ts-ignore
import { Label } from "../../components/ui/label";
// @ts-ignore
import TagBadge from "./TagBadge";
import {
  ArrowLeft,
  Clock,
  Edit,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  BarChart2,
  Plus,
  Trash,
  Calendar,
} from "lucide-react";
import {
  getThread,
  createReply,
  vote,
  getUserVote,
  bookmarkThread,
  unbookmarkThread,
  followThread,
  unfollowThread,
  isUserFollowingThread,
  markThreadAsRead,
} from "../../lib/forum";
// @ts-ignore
import { ForumReply, ForumThread, VoteType } from "../../types/forum";
// @ts-ignore
import { LoadingSpinner } from "../../components/ui/loading-spinner";
// @ts-ignore
import { formatDistanceToNow } from "date-fns";
// @ts-ignore
import { id } from "date-fns/locale";
// @ts-ignore
import { useAuth } from "../../../supabase/auth";
// @ts-ignore
import RichTextContent from "./RichTextContent";
// @ts-ignore
import RichTextEditor from "./RichTextEditor";

export default function ThreadDetail() {
  const { threadId } = useParams<{ threadId: string }>();
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userVote, setUserVote] = useState<VoteType | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchThread = async () => {
      if (!threadId) return;

      try {
        setLoading(true);
        const { thread: threadData, replies: repliesData } = await getThread(
          threadId,
          user?.id,
        );
        setThread(threadData);
        setReplies(repliesData);

        // Mark thread as read if user is logged in
        if (user) {
          await markThreadAsRead(user.id, threadId);
        }

        // Get user's vote if logged in
        if (user) {
          const vote = await getUserVote(user.id, threadId);
          setUserVote(vote);

          // Check if thread is bookmarked
          setIsBookmarked(!!threadData.is_bookmarked);

          // Check if user is following the thread
          const followStatus = await isUserFollowingThread(user.id, threadId);
          setIsFollowing(followStatus.following);
          setEmailNotifications(followStatus.emailNotifications);
        }
      } catch (error) {
        console.error("Error fetching thread:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchThread();
  }, [threadId, user]);

  const handleVote = async (voteType: VoteType) => {
    if (!user || !threadId) return;

    try {
      await vote(user.id, voteType, threadId);

      // Update UI
      if (userVote === voteType) {
        // Toggle off
        setUserVote(null);
        setThread((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            vote_count: {
              ...prev.vote_count!,
              [voteType]: (prev.vote_count?.[voteType] || 0) - 1,
            },
          };
        });
      } else {
        // Toggle on or change vote
        if (userVote) {
          // Change vote type
          setThread((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              vote_count: {
                ...prev.vote_count!,
                [userVote]: (prev.vote_count?.[userVote] || 0) - 1,
                [voteType]: (prev.vote_count?.[voteType] || 0) + 1,
              },
            };
          });
        } else {
          // New vote
          setThread((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              vote_count: {
                ...prev.vote_count!,
                [voteType]: (prev.vote_count?.[voteType] || 0) + 1,
              },
            };
          });
        }
        setUserVote(voteType);
      }
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleReplyVote = async (replyId: string, voteType: VoteType) => {
    if (!user) return;

    try {
      await vote(user.id, voteType, undefined, replyId);

      // Update UI
      setReplies((prevReplies) =>
        prevReplies.map((reply) => {
          if (reply.id !== replyId) return reply;

          // Check if user already voted on this reply
          const userVoteOnReply = reply.user_vote;

          if (userVoteOnReply === voteType) {
            // Toggle off
            return {
              ...reply,
              user_vote: null,
              vote_count: {
                ...reply.vote_count!,
                [voteType]: (reply.vote_count?.[voteType] || 0) - 1,
              },
            };
          } else {
            // Toggle on or change vote
            if (userVoteOnReply) {
              // Change vote type
              return {
                ...reply,
                user_vote: voteType,
                vote_count: {
                  ...reply.vote_count!,
                  [userVoteOnReply]:
                    (reply.vote_count?.[userVoteOnReply] || 0) - 1,
                  [voteType]: (reply.vote_count?.[voteType] || 0) + 1,
                },
              };
            } else {
              // New vote
              return {
                ...reply,
                user_vote: voteType,
                vote_count: {
                  ...reply.vote_count!,
                  [voteType]: (reply.vote_count?.[voteType] || 0) + 1,
                },
              };
            }
          }
        }),
      );
    } catch (error) {
      console.error("Error voting on reply:", error);
    }
  };

  const handleSubmitReply = async () => {
    if (!user || !threadId || !replyContent.trim()) return;

    try {
      setSubmitting(true);
      const newReply = await createReply(replyContent, threadId, user.id);

      // Add user data to the reply for display
      const replyWithUser = {
        ...newReply,
        user: {
          full_name: user.user_metadata?.full_name || user.email || "User",
          avatar_url: user.user_metadata?.avatar_url || null,
          exp: 0, // Default value
        },
        vote_count: {
          cendol: 0,
          bata: 0,
        },
      };

      setReplies((prev) => [...prev, replyWithUser]);
      setReplyContent("");

      // Update reply count in thread
      setThread((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reply_count: (prev.reply_count || 0) + 1,
        };
      });
    } catch (error) {
      console.error("Error creating reply:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBookmark = async () => {
    if (!user || !threadId) return;

    try {
      if (isBookmarked) {
        await unbookmarkThread(user.id, threadId);
      } else {
        await bookmarkThread(user.id, threadId);
      }
      setIsBookmarked(!isBookmarked);

      // Update thread state
      setThread((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          is_bookmarked: !isBookmarked,
        };
      });
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const toggleFollow = async () => {
    if (!user || !threadId) return;

    try {
      if (isFollowing) {
        await unfollowThread(user.id, threadId);
        setIsFollowing(false);
        setEmailNotifications(false);
      } else {
        await followThread(user.id, threadId, true);
        setIsFollowing(true);
        setEmailNotifications(true);
      }

      // Update thread state
      setThread((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          is_followed: !isFollowing,
        };
      });
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Memuat thread..." />
      </div>
    );
  }

  if (!thread) {
    return (
      <Card className="p-6 text-center bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl">
        <p className="text-gray-500">Thread tidak ditemukan.</p>
        <Button
          className="mt-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>

        <div className="flex gap-2">
          <Button
            variant={isBookmarked ? "default" : "outline"}
            size="sm"
            onClick={toggleBookmark}
            className={isBookmarked ? "bg-amber-500 hover:bg-amber-600" : ""}
          >
            {isBookmarked ? "Tersimpan" : "Simpan"}
          </Button>

          <Button
            variant={isFollowing ? "default" : "outline"}
            size="sm"
            onClick={toggleFollow}
            className={isFollowing ? "bg-blue-500 hover:bg-blue-600" : ""}
          >
            {isFollowing ? "Mengikuti" : "Ikuti"}
          </Button>
        </div>
      </div>

      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden">
        <CardHeader>
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

        <CardContent className="space-y-4">
          <div className="prose max-w-none">
            <RichTextContent content={thread.content} />
          </div>

          {thread.tags && thread.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {thread.tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <Link to={`/profile/${thread.user_id}`}>
                <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-purple-300 transition-all">
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
              </Link>
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
                <MessageSquare className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {thread.reply_count || 0}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center ${userVote === "cendol" ? "text-green-600" : "text-gray-500"}`}
                  onClick={() => handleVote("cendol")}
                >
                  <ThumbsUp
                    className={`h-5 w-5 ${userVote === "cendol" ? "fill-green-500 text-green-500" : ""}`}
                  />
                  <span className="ml-1">{thread.vote_count?.cendol || 0}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center ${userVote === "bata" ? "text-red-600" : "text-gray-500"}`}
                  onClick={() => handleVote("bata")}
                >
                  <ThumbsDown
                    className={`h-5 w-5 ${userVote === "bata" ? "fill-red-500 text-red-500" : ""}`}
                  />
                  <span className="ml-1">{thread.vote_count?.bata || 0}</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Balasan ({replies.length})
        </h3>

        {replies.length === 0 ? (
          <Card className="p-6 text-center bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl">
            <p className="text-gray-500">Belum ada balasan.</p>
            <p className="mt-2 text-gray-500">
              Jadilah yang pertama membalas thread ini!
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => (
              <Card
                key={reply.id}
                className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden"
              >
                <CardContent className="pt-6">
                  <div className="prose max-w-none mb-4">
                    <RichTextContent content={reply.content} />
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Link to={`/profile/${reply.user_id}`}>
                        <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-purple-300 transition-all">
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
                      </Link>
                      <div>
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {reply.user?.full_name || "User"}
                          </p>
                          <span className="mx-2 text-gray-300">•</span>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(reply.created_at), {
                              addSuffix: true,
                              locale: id,
                            })}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {reply.user?.exp || 0} EXP
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex items-center ${reply.user_vote === "cendol" ? "text-green-600" : "text-gray-500"}`}
                        onClick={() => handleReplyVote(reply.id, "cendol")}
                      >
                        <ThumbsUp
                          className={`h-4 w-4 ${reply.user_vote === "cendol" ? "fill-green-500 text-green-500" : ""}`}
                        />
                        <span className="ml-1">
                          {reply.vote_count?.cendol || 0}
                        </span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className={`flex items-center ${reply.user_vote === "bata" ? "text-red-600" : "text-gray-500"}`}
                        onClick={() => handleReplyVote(reply.id, "bata")}
                      >
                        <ThumbsDown
                          className={`h-4 w-4 ${reply.user_vote === "bata" ? "fill-red-500 text-red-500" : ""}`}
                        />
                        <span className="ml-1">
                          {reply.vote_count?.bata || 0}
                        </span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {user ? (
          <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Tambahkan Balasan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                value={replyContent}
                onChange={setReplyContent}
                placeholder="Tulis balasan Anda di sini..."
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleSubmitReply}
                disabled={!replyContent.trim() || submitting}
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Mengirim...
                  </>
                ) : (
                  <>Kirim Balasan</>
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="p-6 text-center bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl">
            <p className="text-gray-500">
              Silakan login untuk menambahkan balasan.
            </p>
            <Link to="/login">
              <Button className="mt-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90">
                Login
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}


