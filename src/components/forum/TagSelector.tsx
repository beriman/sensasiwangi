import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tag as TagIcon, Plus, Search } from "lucide-react";
import { ForumTag } from "@/types/forum";
import TagBadge from "./TagBadge";
import { getForumTags } from "@/lib/forum";

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (selectedTags: string[]) => void;
  disabled?: boolean;
}

export default function TagSelector({
  selectedTags,
  onChange,
  disabled = false,
}: TagSelectorProps) {
  const [tags, setTags] = useState<ForumTag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

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

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedTagObjects = tags.filter((tag) =>
    selectedTags.includes(tag.id),
  );

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">
          Tags (Opsional)
        </label>
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
          <PopoverContent className="w-80 p-0" align="end">
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
            <ScrollArea className="h-72 overflow-auto">
              <div className="p-3 grid grid-cols-2 gap-2">
                {loading ? (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    Memuat tags...
                  </div>
                ) : filteredTags.length === 0 ? (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    Tidak ada tag yang sesuai
                  </div>
                ) : (
                  filteredTags.map((tag) => (
                    <TagBadge
                      key={tag.id}
                      tag={tag}
                      selected={selectedTags.includes(tag.id)}
                      onClick={() => toggleTag(tag.id)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
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
    </div>
  );
}
