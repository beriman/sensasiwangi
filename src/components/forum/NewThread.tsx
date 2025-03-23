import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { createThread } from "@/lib/forum";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";

export default function NewThread() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categoryName, setCategoryName] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set category name based on ID
    if (categoryId) {
      setCategoryName(
        categoryId.includes("diskusi") ? "Diskusi Perfumer" : "Review Parfum",
      );
    }
  }, [categoryId]);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk membuat thread baru.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [user, toast, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Form Tidak Lengkap",
        description: "Judul dan konten thread tidak boleh kosong.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const result = await createThread(title, content, categoryId!, user!.id);

      // Check for level up
      if (result.levelUp) {
        const { newLevel, oldLevel } = result.levelUp;
        toast({
          title: "Level Up!",
          description: `Anda naik level dari ${oldLevel} ke ${newLevel}!`,
          variant: "default",
          className: "bg-gradient-to-r from-purple-600 to-pink-500 text-white",
        });
      }

      toast({
        title: "Berhasil",
        description: "Thread berhasil dibuat.",
      });

      // Redirect to the new thread
      navigate(`/forum/thread/${result.thread.id}`);
    } catch (error) {
      console.error("Error creating thread:", error);
      toast({
        title: "Error",
        description: "Gagal membuat thread. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Redirecting..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Link
          to={`/forum/category/${categoryId}`}
          className="flex items-center text-purple-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali ke {categoryName}
        </Link>
      </div>

      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">
            Buat Thread Baru di {categoryName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium text-gray-700"
              >
                Judul Thread
              </label>
              <Input
                id="title"
                placeholder="Masukkan judul thread"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="content"
                className="text-sm font-medium text-gray-700"
              >
                Konten
              </label>
              <Textarea
                id="content"
                placeholder="Tulis konten thread Anda di sini..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={submitting}
                className="min-h-[200px] w-full"
              />
            </div>
            <div className="pt-2">
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Membuat Thread...
                  </>
                ) : (
                  "Buat Thread"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
