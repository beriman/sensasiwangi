// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import { useParams, useNavigate, Link } from "react-router-dom";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Input } from "../../components/ui/input";
// @ts-ignore
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
// @ts-ignore
import TagSelector from "./TagSelector";
// @ts-ignore
import { ArrowLeft, Eye } from "lucide-react";
// @ts-ignore
import RichTextEditor from "./RichTextEditor";
// @ts-ignore
import RichTextContent from "./RichTextContent";
// @ts-ignore
import { createThread, getForumTags, getForumCategories } from "../../lib/forum";
// @ts-ignore
import { LoadingSpinner } from "../../components/ui/loading-spinner";
// @ts-ignore
import { useAuth } from "../../../supabase/auth";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";
// @ts-ignore
import { ForumTag, ForumCategory } from "../../types/forum";

export default function NewThread() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    categoryId,
  );
  const [tags, setTags] = useState<ForumTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories and tags
        const [categoriesData, tagsData] = await Promise.all([
          getForumCategories(),
          getForumTags(),
        ]);

        setCategories(categoriesData);
        setTags(tagsData);

        // Set category name based on ID
        if (categoryId) {
          setSelectedCategory(categoryId);
          const category = categoriesData.find((cat) => cat.id === categoryId);
          if (category) {
            setCategoryName(category.name);
          } else {
            setCategoryName(
              categoryId.includes("diskusi")
                ? "Diskusi Perfumer"
                : "Review Parfum",
            );
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data kategori dan tag.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId, toast]);

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

  const handleTagChange = (tagId: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    const category = categories.find((cat) => cat.id === value);
    if (category) {
      setCategoryName(category.name);
    }
  };

  // Rich text editor handles formatting internally

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !selectedCategory) {
      toast({
        title: "Form Tidak Lengkap",
        description: "Judul, konten, dan kategori thread tidak boleh kosong.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const result = await createThread(
        title,
        content,
        selectedCategory,
        user!.id,
        selectedTags.length > 0 ? selectedTags : undefined,
      );

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

  if (!user || loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text={loading ? "Loading..." : "Redirecting..."} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Link
          to={categoryId ? `/forum/category/${categoryId}` : "/forum"}
          className="flex items-center text-purple-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {categoryId ? `Kembali ke ${categoryName}` : "Kembali ke Forum"}
        </Link>
      </div>

      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">
            Buat Thread Baru {categoryName && `di ${categoryName}`}
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
              <label className="text-sm font-medium text-gray-700">
                Kategori
              </label>
              <Select
                value={selectedCategory}
                onValueChange={handleCategoryChange}
                disabled={submitting || !!categoryId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TagSelector
              selectedTags={selectedTags}
              onChange={setSelectedTags}
              disabled={submitting}
            />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="content"
                  className="text-sm font-medium text-gray-700"
                >
                  Konten
                </label>
                <Button
                  type="button"
                  variant={showPreview ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-2"
                  title="Preview"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showPreview ? "Edit" : "Preview"}
                </Button>
              </div>
              {!showPreview ? (
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Tulis konten thread Anda di sini..."
                  disabled={submitting}
                  className="min-h-[300px]"
                />
              ) : (
                <>
                  <div className="border rounded-md p-4 min-h-[300px] bg-white">
                    <RichTextContent content={content} />
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(false)}
                    >
                      Kembali ke Editor
                    </Button>
                  </div>
                </>
              )}
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


