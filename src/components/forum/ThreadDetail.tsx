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

export default function ThreadDetail() {
  const { threadId } = useParams<{ threadId: string }>();
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [threadVotes, setThreadVotes] = useState<{
    cendol: number;
    bata: number;
  }>({ cendol: 0, bata: 0 });
  const [userReplyVotes, setUserReplyVotes] = useState<
    Record<string, VoteType>
  >({});
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyContent, setEditReplyContent] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchThread = async () => {
      if (!threadId) return;

      try {
        setLoading(true);
        const data = await getThread(threadId);
        setThread(data.thread);
        setReplies(data.replies);

        // Set thread votes
        if (data.thread.vote_count) {
          setThreadVotes(data.thread.vote_count);
        }

        // Get votes for each reply if user is logged in
        if (user) {
          const replyVotes: Record<string, VoteType> = {};
          for (const reply of data.replies) {
            const replyVote = await getUserVote(user.id, undefined, reply.id);
            if (replyVote) {
              replyVotes[reply.id] = replyVote;
            }
          }
          setUserReplyVotes(replyVotes);
        }
      } catch (error) {
        console.error("Error fetching thread:", error);
        toast({
          title: "Error",
          description: "Gagal memuat thread. Silakan coba lagi.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchThread();
  }, [threadId, user, toast]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk membalas thread ini.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!replyContent.trim()) {
      toast({
        title: "Konten Kosong",
        description: "Balasan tidak boleh kosong.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await createReply(replyContent, threadId!, user.id);

      // Refresh thread data
      const data = await getThread(threadId!);
      setThread(data.thread);
      setReplies(data.replies);

      // Clear form
      setReplyContent("");

      toast({
        title: "Berhasil",
        description: "Balasan berhasil ditambahkan.",
      });
    } catch (error) {
      console.error("Error creating reply:", error);
      toast({
        title: "Error",
        description: "Gagal menambahkan balasan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReply = (reply: ForumReply) => {
    setEditingReplyId(reply.id);
    setEditReplyContent(reply.content);
  };

  const handleUpdateReply = async (replyId: string) => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk mengedit balasan.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!editReplyContent.trim()) {
      toast({
        title: "Konten Kosong",
        description: "Balasan tidak boleh kosong.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmittingEdit(true);
      await updateReply(replyId, editReplyContent, user.id);

      // Refresh thread data
      const data = await getThread(threadId!);
      setThread(data.thread);
      setReplies(data.replies);

      // Clear edit state
      setEditingReplyId(null);
      setEditReplyContent("");

      toast({
        title: "Berhasil",
        description: "Balasan berhasil diperbarui.",
      });
    } catch (error) {
      console.error("Error updating reply:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui balasan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk menghapus balasan.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      await deleteReply(replyId, user.id);

      // Refresh thread data
      const data = await getThread(threadId!);
      setThread(data.thread);
      setReplies(data.replies);

      toast({
        title: "Berhasil",
        description: "Balasan berhasil dihapus.",
      });
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus balasan. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const handleReplyVote = async (voteType: VoteType, targetId: string) => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk memberikan vote.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      const result = await vote(user.id, voteType, undefined, targetId);

      // Update UI optimistically
      const currentVote = userReplyVotes[targetId];
      if (currentVote === voteType) {
        // Remove vote if clicking the same button
        const newVotes = { ...userReplyVotes };
        delete newVotes[targetId];
        setUserReplyVotes(newVotes);
      } else {
        // Set or change vote
        setUserReplyVotes({ ...userReplyVotes, [targetId]: voteType });
      }

      // Check for level up
      if (result.levelUp) {
        const { newLevel, oldLevel, userId } = result.levelUp;
        // Get user name from thread or replies
        let userName = "User";
        if (thread?.user_id === userId && thread?.user?.full_name) {
          userName = thread.user.full_name;
        } else {
          const reply = replies.find((r) => r.user_id === userId);
          if (reply?.user?.full_name) {
            userName = reply.user.full_name;
          }
        }

        toast({
          title: "Level Up!",
          description: `${userName} naik level dari ${oldLevel} ke ${newLevel}!`,
          variant: "default",
          className: "bg-gradient-to-r from-purple-600 to-pink-500 text-white",
        });
      }

      // Refresh thread data to get updated vote counts
      const data = await getThread(threadId!);
      setThread(data.thread);
      setReplies(data.replies);
    } catch (error) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description: "Gagal memberikan vote. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const handleThreadVoteComplete = (newVotes: {
    cendol: number;
    bata: number;
  }) => {
    setThreadVotes(newVotes);

    // Refresh thread data to get updated information
    const refreshThread = async () => {
      try {
        const data = await getThread(threadId!);
        setThread(data.thread);
        setReplies(data.replies);
      } catch (error) {
        console.error("Error refreshing thread:", error);
      }
    };

    refreshThread();
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
        <Link
          to="/forum"
          className="mt-4 inline-block text-purple-600 hover:underline"
        >
          Kembali ke Forum
        </Link>
      </Card>
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
          Kembali ke Daftar Thread
        </Link>
      </div>

      {/* Thread */}
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
                {thread.updated_at &&
                  thread.updated_at !== thread.created_at && (
                    <span className="ml-1 text-xs italic">
                      (edited{" "}
                      {formatDistanceToNow(new Date(thread.updated_at), {
                        addSuffix: true,
                        locale: id,
                      })}
                      )
                    </span>
                  )}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none mb-6 whitespace-pre-line">
            {thread.content}
          </div>
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
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
              <p className="font-medium text-gray-900">
                {thread.user?.full_name || "User"}
              </p>
              <p className="text-sm text-gray-500">
                {thread.user?.exp || 0} EXP
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-100 pt-4 flex justify-between">
          <div className="flex items-center space-x-2">
            <ThreadVote
              threadId={thread.id}
              initialVotes={threadVotes}
              onVoteComplete={handleThreadVoteComplete}
            />
            {user && user.id === thread.user_id && (
              <Link to={`/forum/edit-thread/${thread.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Button>
              </Link>
            )}
          </div>
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            <MessageSquare className="h-3 w-3 mr-1" />
            {replies.length} Balasan
          </Badge>
        </CardFooter>
      </Card>

      {/* Replies */}
      <div className="space-y-4 mt-6">
        <h3 className="text-lg font-semibold text-gray-900">Balasan</h3>

        {replies.length === 0 ? (
          <Card className="p-6 text-center bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl">
            <p className="text-gray-500">Belum ada balasan untuk thread ini.</p>
            <p className="mt-2 text-gray-500">Jadilah yang pertama membalas!</p>
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
                    <div className="flex items-center space-x-3">
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
                        <p className="font-medium text-gray-900">
                          {reply.user?.full_name || "User"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {reply.user?.exp || 0} EXP
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(reply.created_at), {
                        addSuffix: true,
                        locale: id,
                      })}
                      {reply.updated_at &&
                        reply.updated_at !== reply.created_at && (
                          <span className="ml-1 text-xs italic">
                            (edited{" "}
                            {formatDistanceToNow(new Date(reply.updated_at), {
                              addSuffix: true,
                              locale: id,
                            })}
                            )
                          </span>
                        )}
                    </div>
                  </div>

                  {editingReplyId === reply.id ? (
                    <div className="mb-4">
                      <Textarea
                        value={editReplyContent}
                        onChange={(e) => setEditReplyContent(e.target.value)}
                        className="min-h-[120px] mb-2"
                        disabled={isSubmittingEdit}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingReplyId(null)}
                          disabled={isSubmittingEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleUpdateReply(reply.id)}
                          disabled={isSubmittingEdit}
                          className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90"
                        >
                          {isSubmittingEdit ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose max-w-none mb-4 whitespace-pre-line">
                      {reply.content}
                    </div>
                  )}

                  {user && (
                    <ReplyActions
                      replyId={reply.id}
                      isAuthor={user.id === reply.user_id}
                      userVote={userReplyVotes[reply.id] || null}
                      voteCount={reply.vote_count || { cendol: 0, bata: 0 }}
                      onVote={(voteType) => handleReplyVote(voteType, reply.id)}
                      onEdit={() => handleEditReply(reply)}
                      onDelete={() => handleDeleteReply(reply.id)}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reply form */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden mt-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Tambahkan Balasan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleReplySubmit}>
              <Textarea
                placeholder="Tulis balasan Anda di sini..."
                className="min-h-[120px] mb-4"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                disabled={submitting || !user}
              />
              {!user ? (
                <div className="text-center">
                  <p className="text-gray-500 mb-2">
                    Silakan login untuk membalas thread ini.
                  </p>
                  <Link to="/login">
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90">
                      Login
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90"
                  disabled={submitting}
                >
                  {submitting ? "Mengirim..." : "Kirim Balasan"}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
