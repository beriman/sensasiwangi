import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, AlertCircle } from "lucide-react";
import { useAuth } from "../../lib/auth-provider";
import { supabase } from "../../lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";

interface SambatanComment {
  id: string;
  sambatan_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url: string;
  };
}

interface SambatanDiscussionSectionProps {
  sambatanId: string;
}

export default function SambatanDiscussionSection({
  sambatanId,
}: SambatanDiscussionSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<SambatanComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [sambatanId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("sambatan_comments")
        .select(
          `
          *,
          user:user_id(full_name, avatar_url)
        `
        )
        .eq("sambatan_id", sambatanId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !commentText.trim()) return;

    try {
      setSubmitting(true);
      
      // First, ensure the table exists
      await ensureSambatanCommentsTableExists();

      const { data, error } = await supabase
        .from("sambatan_comments")
        .insert({
          sambatan_id: sambatanId,
          user_id: user.id,
          content: commentText.trim(),
        })
        .select(
          `
          *,
          user:user_id(full_name, avatar_url)
        `
        )
        .single();

      if (error) throw error;

      setComments([...comments, data]);
      setCommentText("");
      toast({
        title: "Komentar terkirim",
        description: "Komentar Anda telah berhasil ditambahkan.",
      });
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      toast({
        title: "Gagal mengirim komentar",
        description: error.message || "Terjadi kesalahan saat mengirim komentar.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const ensureSambatanCommentsTableExists = async () => {
    try {
      // Check if table exists
      const { data, error } = await supabase
        .from("sambatan_comments")
        .select("id")
        .limit(1);

      if (error && error.code === "42P01") {
        // Table doesn't exist, create it
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS sambatan_comments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            sambatan_id UUID NOT NULL REFERENCES sambatan(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id),
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
        `;
        
        // Execute SQL to create table
        await supabase.rpc("exec_sql", { sql: createTableSQL });
      }
    } catch (error) {
      console.error("Error ensuring sambatan_comments table exists:", error);
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
          Diskusi Sambatan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Comments List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner text="Memuat komentar..." />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Belum ada komentar</p>
                <p className="text-sm text-gray-400 mt-1">
                  Jadilah yang pertama berkomentar
                </p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={
                        comment.user?.avatar_url ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`
                      }
                      alt={comment.user?.full_name || ""}
                    />
                    <AvatarFallback>
                      {comment.user?.full_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {comment.user?.full_name || "Pengguna"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: id,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Form */}
          {user ? (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      user.user_metadata?.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                    }
                    alt={user.user_metadata?.full_name || ""}
                  />
                  <AvatarFallback>
                    {user.user_metadata?.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Tulis komentar Anda..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || submitting}
                    >
                      {submitting ? (
                        <LoadingSpinner className="h-4 w-4 mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Kirim Komentar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
              <p className="text-sm text-gray-600">
                Silakan{" "}
                <a href="/login" className="text-purple-600 hover:underline">
                  login
                </a>{" "}
                untuk menambahkan komentar.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
