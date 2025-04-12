// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Input } from "../../components/ui/input";
// @ts-ignore
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
// @ts-ignore
import { Tag as TagIcon, Plus, Search, PlusCircle } from "lucide-react";
// @ts-ignore
import { ForumTag } from "../../types/forum";
// @ts-ignore
import TagBadge from "./TagBadge";
// @ts-ignore
import { getForumTags, createCustomTag } from "../../lib/forum";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";
// @ts-ignore
import { useAuth } from "../../../supabase/auth";
// @ts-ignore
import { hasPrivilege } from "../../lib/reputation";
// @ts-ignore
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (selectedTags: string[]) => void;
  disabled?: boolean;
  allowCustomTags?: boolean;
}

const TAG_COLORS = [
  "#3B82F6", // blue-500
  "#10B981", // emerald-500
  "#6366F1", // indigo-500
  "#EC4899", // pink-500
  "#8B5CF6", // violet-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#14B8A6", // teal-500
  "#F97316", // orange-500
  "#6B7280", // gray-500
];

export default function TagSelector({
  selectedTags,
  onChange,
  disabled = false,
  allowCustomTags = true,
}: TagSelectorProps) {
  const [tags, setTags] = useState<ForumTag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [creatingTag, setCreatingTag] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const tagsData = await getForumTags();
        setTags(tagsData);
      } catch (error) {
        console.error("Error fetching tags:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const toggleTag = (tagId: string) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];

    onChange(newSelectedTags);
  };

  const handleCreateTag = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to create custom tags",
        variant: "destructive",
      });
      return;
    }

    // Check if user has the privilege to create custom tags
    const { data: userData } = await supabase
      .from("users")
      .select("exp_points")
      .eq("id", user.id)
      .single();

    const userExp = userData?.exp_points || 0;

    if (!hasPrivilege(userExp, "Create custom tags")) {
      toast({
        title: "Privilege Required",
        description:
          "You need to reach Level 2 (Apprentice) to create custom tags",
        variant: "destructive",
      });
      return;
    }

    if (!newTagName.trim()) {
      toast({
        title: "Tag name required",
        description: "Please enter a name for your tag",
        variant: "destructive",
      });
      return;
    }

    // Check if tag with same name already exists
    if (
      tags.some(
        (tag) => tag.name.toLowerCase() === newTagName.trim().toLowerCase(),
      )
    ) {
      toast({
        title: "Tag already exists",
        description: "A tag with this name already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreatingTag(true);
      const newTag = await createCustomTag({
        name: newTagName.trim(),
        color: selectedColor,
        user_id: user.id,
      });

      // Add new tag to the list and select it
      setTags((prev) => [...prev, newTag]);
      onChange([...selectedTags, newTag.id]);

      toast({
        title: "Tag created",
        description: `Tag "${newTag.name}" has been created successfully`,
      });

      // Reset form and close dialog
      setNewTagName("");
      setSelectedColor(TAG_COLORS[0]);
      setCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating tag:", error);
      toast({
        title: "Error",
        description: "Failed to create tag. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingTag(false);
    }
  };

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Group tags by category
  const groupedTags = filteredTags.reduce(
    (acc, tag) => {
      const category = tag.category || "General";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(tag);
      return acc;
    },
    {} as Record<string, ForumTag[]>,
  );

  // Sort categories alphabetically, but keep "General" at the top
  const sortedCategories = Object.keys(groupedTags).sort((a, b) => {
    if (a === "General") return -1;
    if (b === "General") return 1;
    return a.localeCompare(b);
  });

  const selectedTagObjects = tags.filter((tag) =>
    selectedTags.includes(tag.id),
  );

  // Get popular tags (for now just show first 10)
  const popularTags = [...tags]
    .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
    .slice(0, 10);

  // Get user's custom tags
  const userCustomTags = tags.filter((tag) => tag.user_id === user?.id);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">
          Tags (Opsional)
        </label>
        <div className="flex gap-2">
          {allowCustomTags && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              disabled={disabled}
              className="h-8 gap-1"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Create Tag
            </Button>
          )}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                className="h-8 gap-1"
              >
                <TagIcon className="h-4 w-4" />
                <Plus className="h-3 w-3" />
                Pilih Tag
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari tag..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="w-full grid grid-cols-3 p-1 m-2">
                  <TabsTrigger value="browse">Browse</TabsTrigger>
                  <TabsTrigger value="popular">Popular</TabsTrigger>
                  {user && <TabsTrigger value="custom">My Tags</TabsTrigger>}
                </TabsList>

                <TabsContent value="browse" className="mt-0">
                  <ScrollArea className="h-72 overflow-auto">
                    {loading ? (
                      <div className="text-center py-4 text-gray-500">
                        Memuat tags...
                      </div>
                    ) : filteredTags.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        Tidak ada tag yang sesuai
                      </div>
                    ) : (
                      <div className="p-3 space-y-4">
                        {sortedCategories.map((category) => (
                          <div key={category}>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">
                              {category}
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                              {groupedTags[category].map((tag) => (
                                <TagBadge
                                  key={tag.id}
                                  tag={tag}
                                  selected={selectedTags.includes(tag.id)}
                                  onClick={() => toggleTag(tag.id)}
                                  showDescription
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="popular" className="mt-0">
                  <ScrollArea className="h-72 overflow-auto">
                    <div className="p-3 grid grid-cols-2 gap-2">
                      {popularTags.length === 0 ? (
                        <div className="col-span-2 text-center py-4 text-gray-500">
                          No popular tags yet
                        </div>
                      ) : (
                        popularTags.map((tag) => (
                          <TagBadge
                            key={tag.id}
                            tag={tag}
                            selected={selectedTags.includes(tag.id)}
                            onClick={() => toggleTag(tag.id)}
                            showUsageCount
                          />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {user && (
                  <TabsContent value="custom" className="mt-0">
                    <ScrollArea className="h-72 overflow-auto">
                      <div className="p-3 grid grid-cols-2 gap-2">
                        {userCustomTags.length === 0 ? (
                          <div className="col-span-2 text-center py-4 text-gray-500">
                            You haven't created any custom tags yet
                          </div>
                        ) : (
                          userCustomTags.map((tag) => (
                            <TagBadge
                              key={tag.id}
                              tag={tag}
                              selected={selectedTags.includes(tag.id)}
                              onClick={() => toggleTag(tag.id)}
                              showDescription
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                )}
              </Tabs>

              {allowCustomTags && (
                <div className="p-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => {
                      setOpen(false);
                      setCreateDialogOpen(true);
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Custom Tag
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 min-h-10 p-3 border rounded-md bg-gray-50">
        {selectedTagObjects.length === 0 ? (
          <div className="text-sm text-gray-400 flex items-center">
            Belum ada tag yang dipilih
          </div>
        ) : (
          selectedTagObjects.map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              selected={true}
              onClick={() => toggleTag(tag.id)}
              size="md"
            />
          ))
        )}
      </div>

      {/* Create Custom Tag Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tag Name</label>
              <Input
                placeholder="Enter tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                maxLength={20}
              />
              <p className="text-xs text-gray-500">
                {newTagName.length}/20 characters
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tag Color</label>
              <div className="grid grid-cols-5 gap-2">
                {TAG_COLORS.map((color) => (
                  <div
                    key={color}
                    className={`h-8 w-full rounded-md cursor-pointer transition-all ${selectedColor === color ? "ring-2 ring-offset-2 ring-black" : "hover:scale-105"}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium">Preview:</p>
              <div className="mt-2 flex items-center">
                <TagBadge
                  tag={{
                    id: "preview",
                    name: newTagName || "Tag Preview",
                    color: selectedColor,
                  }}
                  selected={true}
                  size="md"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creatingTag}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTag}
              disabled={creatingTag || !newTagName.trim()}
            >
              {creatingTag ? "Creating..." : "Create Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


