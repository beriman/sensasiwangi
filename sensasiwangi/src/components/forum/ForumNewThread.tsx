// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import { useNavigate } from "react-router-dom";
// @ts-ignore
import { Card, CardContent } from "../../components/ui/card";
// @ts-ignore
import { Input } from "../../components/ui/input";
// @ts-ignore
import { Textarea } from "../../components/ui/textarea";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Label } from "../../components/ui/label";
// @ts-ignore
import { Checkbox } from "../../components/ui/checkbox";
// @ts-ignore
import { supabase } from "../../lib/supabase";
// @ts-ignore
import { useAuth } from "../../lib/auth-provider";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";
// @ts-ignore
import { LoadingSpinner } from "../../components/ui/loading-spinner";
import { 
  Save, 
  X, 
  AlertCircle,
  Pin
} from "lucide-react";

interface ForumNewThreadProps {
  categoryId: string;
}

export default function ForumNewThread({ categoryId }: ForumNewThreadProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate("/login", { state: { from: `/forum/new-thread/${categoryId}` } });
      return;
    }

    const fetchCategoryAndUserRole = async () => {
      try {
        // Fetch category name
        const { data: categoryData, error: categoryError } = await supabase
          .from("forum_categories")
          .select("name")
          .eq("id", categoryId)
          .single();
        
        if (categoryError) throw categoryError;
        setCategoryName(categoryData.name);
        
        // Check if user is admin
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        
        if (userError) throw userError;
        setIsAdmin(userData.role === "admin" || userData.role === "moderator");
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load category information. Please try again.",
          variant: "destructive",
        });
        navigate("/forum");
      }
    };
    
    fetchCategoryAndUserRole();
  }, [user, categoryId, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate("/login", { state: { from: `/forum/new-thread/${categoryId}` } });
      return;
    }
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Thread title cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Thread content cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Insert thread
      const { data, error } = await supabase
        .from("forum_threads")
        .insert({
          title,
          content,
          user_id: user.id,
          category_id: categoryId,
          is_pinned: isAdmin && isPinned,
        })
        .select();
      
      if (error) throw error;
      
      // Update category's thread count and last activity
      await supabase
        .from("forum_categories")
        .update({
          thread_count: supabase.rpc("increment", { x: 1 }),
          last_activity: new Date().toISOString(),
          last_thread_id: data[0].id,
          last_thread_title: title,
          last_user_id: user.id,
          last_user_name: user.user_metadata?.username || user.email?.split("@")[0] || "User",
          last_user_avatar: user.user_metadata?.avatar_url,
        })
        .eq("id", categoryId);
      
      // Award experience points to the user
      await supabase.rpc("award_exp", { user_id: user.id, exp_amount: 5, action_type: "create_thread" });
      
      toast({
        title: "Success",
        description: "Your thread has been created.",
      });
      
      // Navigate to the new thread
      navigate(`/forum/thread/${data[0].id}`);
    } catch (error) {
      console.error("Error creating thread:", error);
      toast({
        title: "Error",
        description: "Failed to create thread. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/forum/category/${categoryId}`);
  };

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Thread Title</Label>
            <Input
              id="title"
              placeholder="Enter a descriptive title for your thread"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Thread Content</Label>
            <Textarea
              id="content"
              placeholder="Write your thread content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="resize-y"
              required
            />
            <p className="text-xs text-gray-500">
              You can use basic HTML formatting in your content.
            </p>
          </div>
          
          {isAdmin && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pinned"
                checked={isPinned}
                onCheckedChange={(checked) => setIsPinned(checked as boolean)}
              />
              <Label htmlFor="pinned" className="flex items-center cursor-pointer">
                <Pin className="h-4 w-4 mr-2 text-orange-500" />
                Pin this thread
              </Label>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Posting Guidelines</h4>
              <ul className="text-xs text-blue-700 mt-1 list-disc list-inside">
                <li>Be respectful and considerate of others</li>
                <li>Stay on topic and provide relevant information</li>
                <li>Do not post offensive or inappropriate content</li>
                <li>Do not share personal information</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Thread
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}


