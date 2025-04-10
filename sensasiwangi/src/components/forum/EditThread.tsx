import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TagSelector from "./TagSelector";
import { ArrowLeft, Eye } from "lucide-react";
import RichTextEditor from "./RichTextEditor";
import RichTextContent from "./RichTextContent";
import {
  getThread,
  updateThread,
  getForumTags,
  getForumCategories,
} from "@/lib/forum";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { ForumTag, ForumCategory } from "@/types/forum";

export default function EditThread() {
  const { threadId } = useParams<{ threadId: string }>();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [tags, setTags] = useState<ForumTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [originalAuthorId, setOriginalAuthorId] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchThreadData = async () => {
      if (!threadId || !user) return;

      try {
        setLoading(true);

        // Fetch thread data
        const { thread } = await getThread(threadId);

        // Check if user is the author of the thread
        if (thread.user_id !== user.id) {
          toast({
            title: "Unauthorized",
            description: "You can only edit your own threads.",
            variant: "destructive",
          });
          navigate(`/forum/thread/${threadId}`);
          return;
        }

        setOriginalAuthorId(thread.user_id);
        setTitle(thread.title);
        setContent(thread.content);
        setSelectedCategory(thread.category_id);

        // Fetch categories and tags
        const [categoriesData, tagsData] = await Promise.all([
          getForumCategories(),
          getForumTags(),
        ]);

        setCategories(categoriesData);
        setTags(tagsData);

        // Set category name based on ID
        const category = categoriesData.find(
          (cat) => cat.id === thread.category_id,
        );
        if (category) {
          setCategoryName(category.name);
        }

        // Get thread tags if any
        if (thread.tags && thread.tags.length > 0) {
          setSelectedTags(thread.tags.map((tag) => tag.id));
        }
      } catch (error) {
        console.error("Error fetching thread data:", error);
        toast({
          title: "Error",
          description: "Failed to load thread data. Please try again.",
          variant: "destructive",
        });
        navigate(`/forum/thread/${threadId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchThreadData();
  }, [threadId, user, toast, navigate]);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to edit threads.",
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
        title: "Form Incomplete",
        description: "Title, content, and category cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await updateThread(
        threadId!,
        title,
        content,
        selectedCategory,
        user!.id,
        selectedTags.length > 0 ? selectedTags : undefined,
      );

      toast({
        title: "Success",
        description: "Thread updated successfully.",
      });

      // Redirect to the thread
      navigate(`/forum/thread/${threadId}`);
    } catch (error) {
      console.error("Error updating thread:", error);
      toast({
        title: "Error",
        description: "Failed to update thread. Please try again.",
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
          to={`/forum/thread/${threadId}`}
          className="flex items-center text-purple-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Thread
        </Link>
      </div>

      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">
            Edit Thread {categoryName && `in ${categoryName}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium text-gray-700"
              >
                Thread Title
              </label>
              <Input
                id="title"
                placeholder="Enter thread title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Category
              </label>
              <Select
                value={selectedCategory}
                onValueChange={handleCategoryChange}
                disabled={submitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
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
                  Content
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
                  placeholder="Write your thread content here..."
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
                      Back to Editor
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
                    Updating Thread...
                  </>
                ) : (
                  "Update Thread"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
