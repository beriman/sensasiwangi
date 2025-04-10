import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  BarChart4, 
  TrendingUp,
  Hash
} from "lucide-react";

interface ForumTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  usage_count: number;
  is_trending?: boolean;
}

const colorOptions = [
  { name: "Gray", value: "bg-gray-100 text-gray-800" },
  { name: "Red", value: "bg-red-100 text-red-800" },
  { name: "Orange", value: "bg-orange-100 text-orange-800" },
  { name: "Amber", value: "bg-amber-100 text-amber-800" },
  { name: "Yellow", value: "bg-yellow-100 text-yellow-800" },
  { name: "Lime", value: "bg-lime-100 text-lime-800" },
  { name: "Green", value: "bg-green-100 text-green-800" },
  { name: "Emerald", value: "bg-emerald-100 text-emerald-800" },
  { name: "Teal", value: "bg-teal-100 text-teal-800" },
  { name: "Cyan", value: "bg-cyan-100 text-cyan-800" },
  { name: "Sky", value: "bg-sky-100 text-sky-800" },
  { name: "Blue", value: "bg-blue-100 text-blue-800" },
  { name: "Indigo", value: "bg-indigo-100 text-indigo-800" },
  { name: "Violet", value: "bg-violet-100 text-violet-800" },
  { name: "Purple", value: "bg-purple-100 text-purple-800" },
  { name: "Fuchsia", value: "bg-fuchsia-100 text-fuchsia-800" },
  { name: "Pink", value: "bg-pink-100 text-pink-800" },
  { name: "Rose", value: "bg-rose-100 text-rose-800" },
];

export default function TagManager() {
  const { user, isAdmin, isModerator } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [tags, setTags] = useState<ForumTag[]>([]);
  const [filteredTags, setFilteredTags] = useState<ForumTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "usage" | "date">("usage");
  
  // Tag form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTag, setCurrentTag] = useState<ForumTag | null>(null);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState(colorOptions[0].value);
  const [formLoading, setFormLoading] = useState(false);
  
  // Tag stats
  const [tagStats, setTagStats] = useState({
    totalTags: 0,
    totalUsage: 0,
    mostUsedTag: "",
    trendingTags: 0,
  });

  useEffect(() => {
    // Redirect if not admin or moderator
    if (user && !isAdmin && !isModerator) {
      navigate("/forum");
      return;
    }
    
    fetchTags();
  }, [user, isAdmin, isModerator, navigate]);
  
  useEffect(() => {
    filterAndSortTags();
  }, [tags, searchTerm, sortBy]);
  
  const fetchTags = async () => {
    try {
      setLoading(true);
      
      // Get all tags with usage count
      const { data, error } = await supabase
        .from("forum_tags")
        .select(`
          *,
          usage_count:forum_thread_tags!forum_thread_tags_tag_id_fkey(count)
        `);
      
      if (error) throw error;
      
      // Process the data to get usage count
      const processedTags = (data || []).map(tag => ({
        ...tag,
        usage_count: tag.usage_count?.length || 0,
      }));
      
      // Calculate trending tags (simplified algorithm)
      // In a real implementation, you'd use a more sophisticated algorithm
      // based on recent usage growth
      const tagsWithTrending = processedTags.map(tag => ({
        ...tag,
        is_trending: Math.random() > 0.7, // Simplified for demo
      }));
      
      setTags(tagsWithTrending);
      
      // Calculate stats
      const totalTags = tagsWithTrending.length;
      const totalUsage = tagsWithTrending.reduce((sum, tag) => sum + tag.usage_count, 0);
      const mostUsedTag = tagsWithTrending.reduce(
        (prev, current) => (prev.usage_count > current.usage_count) ? prev : current, 
        { name: "", usage_count: 0 }
      ).name;
      const trendingTags = tagsWithTrending.filter(tag => tag.is_trending).length;
      
      setTagStats({
        totalTags,
        totalUsage,
        mostUsedTag,
        trendingTags,
      });
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast({
        title: "Error",
        description: "Failed to load tags",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const filterAndSortTags = () => {
    let filtered = [...tags];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tag => 
        tag.name.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "usage") {
        return b.usage_count - a.usage_count;
      } else { // date
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    
    setFilteredTags(filtered);
  };
  
  const handleCreateTag = () => {
    setIsEditing(false);
    setCurrentTag(null);
    setTagName("");
    setTagColor(colorOptions[0].value);
    setIsDialogOpen(true);
  };
  
  const handleEditTag = (tag: ForumTag) => {
    setIsEditing(true);
    setCurrentTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
    setIsDialogOpen(true);
  };
  
  const handleDeleteTag = async (tagId: string) => {
    if (!confirm("Are you sure you want to delete this tag? This action cannot be undone.")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from("forum_tags")
        .delete()
        .eq("id", tagId);
      
      if (error) throw error;
      
      // Update local state
      setTags(tags.filter(tag => tag.id !== tagId));
      
      toast({
        title: "Tag Deleted",
        description: "The tag has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast({
        title: "Error",
        description: "Failed to delete the tag",
        variant: "destructive",
      });
    }
  };
  
  const handleSubmitTag = async () => {
    if (!tagName.trim()) {
      toast({
        title: "Error",
        description: "Tag name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setFormLoading(true);
      
      if (isEditing && currentTag) {
        // Update existing tag
        const { error } = await supabase
          .from("forum_tags")
          .update({
            name: tagName.trim(),
            color: tagColor,
          })
          .eq("id", currentTag.id);
        
        if (error) throw error;
        
        // Update local state
        setTags(tags.map(tag => 
          tag.id === currentTag.id 
            ? { ...tag, name: tagName.trim(), color: tagColor } 
            : tag
        ));
        
        toast({
          title: "Tag Updated",
          description: "The tag has been updated successfully.",
        });
      } else {
        // Create new tag
        const { data, error } = await supabase
          .from("forum_tags")
          .insert({
            name: tagName.trim(),
            color: tagColor,
          })
          .select();
        
        if (error) throw error;
        
        // Update local state
        if (data && data[0]) {
          setTags([...tags, { ...data[0], usage_count: 0, is_trending: false }]);
        }
        
        toast({
          title: "Tag Created",
          description: "The new tag has been created successfully.",
        });
      }
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      setTagName("");
      setTagColor(colorOptions[0].value);
      setCurrentTag(null);
    } catch (error) {
      console.error("Error saving tag:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} the tag`,
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };
  
  if (loading && tags.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center">
            <Tag className="mr-2 h-6 w-6 text-primary" />
            Forum Tag Management
          </h1>
          <p className="text-gray-500 mt-1">
            Create, edit, and manage tags for forum threads
          </p>
        </div>
        
        <Button onClick={handleCreateTag}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Tag
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Tags</p>
                <h3 className="text-2xl font-bold mt-1">{tagStats.totalTags}</h3>
              </div>
              <Hash className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Usage</p>
                <h3 className="text-2xl font-bold mt-1">{tagStats.totalUsage}</h3>
              </div>
              <BarChart4 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Most Used Tag</p>
                <h3 className="text-xl font-bold mt-1 truncate max-w-[150px]">
                  {tagStats.mostUsedTag || "N/A"}
                </h3>
              </div>
              <Tag className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Trending Tags</p>
                <h3 className="text-2xl font-bold mt-1">{tagStats.trendingTags}</h3>
              </div>
              <TrendingUp className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Sort */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search tags..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={sortBy === "usage" ? "default" : "outline"} 
            size="sm"
            onClick={() => setSortBy("usage")}
          >
            <BarChart4 className="h-4 w-4 mr-1" />
            By Usage
          </Button>
          
          <Button 
            variant={sortBy === "name" ? "default" : "outline"} 
            size="sm"
            onClick={() => setSortBy("name")}
          >
            <Tag className="h-4 w-4 mr-1" />
            By Name
          </Button>
          
          <Button 
            variant={sortBy === "date" ? "default" : "outline"} 
            size="sm"
            onClick={() => setSortBy("date")}
          >
            <Clock className="h-4 w-4 mr-1" />
            By Date
          </Button>
        </div>
      </div>
      
      {/* Tag List */}
      {filteredTags.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No tags found matching your criteria.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTags.map((tag) => (
            <Card key={tag.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={tag.color}>
                      {tag.name}
                    </Badge>
                    
                    {tag.is_trending && (
                      <Badge variant="outline" className="bg-red-50">
                        <TrendingUp className="h-3 w-3 mr-1 text-red-500" />
                        Trending
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditTag(tag)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTag(tag.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                  <div>
                    Used in {tag.usage_count} thread{tag.usage_count !== 1 ? 's' : ''}
                  </div>
                  
                  <div>
                    Created {new Date(tag.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Create/Edit Tag Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Tag" : "Create New Tag"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update the tag details below." 
                : "Enter the details for the new tag."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tagName">Tag Name</Label>
              <Input
                id="tagName"
                placeholder="Enter tag name"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tag Color</Label>
              <div className="grid grid-cols-3 gap-2">
                {colorOptions.map((color) => (
                  <div
                    key={color.value}
                    className={`p-2 rounded-md cursor-pointer border-2 ${
                      tagColor === color.value ? "border-primary" : "border-transparent"
                    }`}
                    onClick={() => setTagColor(color.value)}
                  >
                    <Badge className={color.value}>
                      {color.name}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-2">
              <Label>Preview</Label>
              <div className="mt-2 p-4 bg-gray-50 rounded-md flex items-center justify-center">
                <Badge className={tagColor}>
                  {tagName || "Tag Preview"}
                </Badge>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitTag} disabled={formLoading}>
              {formLoading ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Update Tag" : "Create Tag"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Missing component imports
import { Clock } from "lucide-react";
