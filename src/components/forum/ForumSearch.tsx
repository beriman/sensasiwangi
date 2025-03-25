import React, { useState, useEffect } from "react";
import { Search } from "@/components/ui/search";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import TagBadge from "./TagBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ForumSearchFilters, ForumTag } from "@/types/forum";
import {
  X,
  Filter,
  Clock,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  Calendar,
  User,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { searchThreads, getForumTags } from "@/lib/forum";

interface ForumSearchProps {
  onSearchResults: (results: any[]) => void;
  categoryId?: string;
}

export default function ForumSearch({
  onSearchResults,
  categoryId,
}: ForumSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<ForumSearchFilters>({
    categoryId: categoryId,
    sortBy: "newest",
    timeFrame: "all",
    dateFrom: "",
    dateTo: "",
    authorId: "",
  });
  const [authorName, setAuthorName] = useState("");
  const [authors, setAuthors] = useState<
    Array<{ id: string; full_name: string }>
  >([]);
  const [showAuthorResults, setShowAuthorResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<ForumTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    // Update categoryId in filters when prop changes
    setFilters((prev) => ({ ...prev, categoryId }));
  }, [categoryId]);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const tagData = await getForumTags();
        setTags(tagData);
      } catch (error) {
        console.error("Error loading tags:", error);
      }
    };

    loadTags();
  }, []);

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    if (value.length > 2 || value.length === 0) {
      performSearch(value);
    }
  };

  const performSearch = async (term: string = searchTerm) => {
    setLoading(true);
    try {
      const results = await searchThreads(term, {
        ...filters,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });
      onSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchAuthors = async (query: string) => {
    if (query.length < 2) {
      setAuthors([]);
      setShowAuthorResults(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name")
        .ilike("full_name", `%${query}%`)
        .limit(5);

      if (error) throw error;
      setAuthors(data || []);
      setShowAuthorResults(data && data.length > 0);
    } catch (error) {
      console.error("Error searching authors:", error);
    }
  };

  const handleAuthorSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAuthorName(value);
    searchAuthors(value);
  };

  const selectAuthor = (id: string, name: string) => {
    setFilters({ ...filters, authorId: id });
    setAuthorName(name);
    setShowAuthorResults(false);
    performSearch();
  };

  const handleDateChange = (field: "dateFrom" | "dateTo", value: string) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleSortChange = (value: string) => {
    const newFilters = {
      ...filters,
      sortBy: value as ForumSearchFilters["sortBy"],
    };
    setFilters(newFilters);
    performSearch();
  };

  const handleTimeFrameChange = (value: string) => {
    const newFilters = {
      ...filters,
      timeFrame: value as ForumSearchFilters["timeFrame"],
    };
    setFilters(newFilters);
    performSearch();
  };

  const toggleTag = (tagId: string) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];

    setSelectedTags(newSelectedTags);

    // Update filters and search
    const newFilters = {
      ...filters,
      tags: newSelectedTags.length > 0 ? newSelectedTags : undefined,
    };
    setFilters(newFilters);
    performSearch();
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setAuthorName("");
    setFilters({
      categoryId,
      sortBy: "newest",
      timeFrame: "all",
      dateFrom: "",
      dateTo: "",
      authorId: "",
    });
    performSearch();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <div className="flex-1">
          <Search
            placeholder="Cari thread..."
            onSearch={handleSearch}
            loading={loading}
            className="w-full"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="md:w-auto w-full flex items-center"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter
          {(selectedTags.length > 0 ||
            filters.sortBy !== "newest" ||
            filters.timeFrame !== "all" ||
            filters.dateFrom ||
            filters.dateTo ||
            filters.authorId) && (
            <Badge className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-100">
              {selectedTags.length +
                (filters.sortBy !== "newest" ? 1 : 0) +
                (filters.timeFrame !== "all" ? 1 : 0) +
                (filters.dateFrom ? 1 : 0) +
                (filters.dateTo ? 1 : 0) +
                (filters.authorId ? 1 : 0)}
            </Badge>
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Filter & Urutkan</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs"
            >
              <X className="h-3 w-3 mr-1" /> Reset
            </Button>
          </div>

          <div className="space-y-4">
            {/* Sort options */}
            <div>
              <h4 className="text-xs font-medium mb-2 text-gray-500">
                Urutkan berdasarkan:
              </h4>
              <Tabs
                value={filters.sortBy}
                onValueChange={handleSortChange}
                className="w-full"
              >
                <TabsList className="w-full grid grid-cols-5 h-8">
                  <TabsTrigger value="newest" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" /> Terbaru
                  </TabsTrigger>
                  <TabsTrigger value="oldest" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" /> Terlama
                  </TabsTrigger>
                  <TabsTrigger value="most_votes" className="text-xs">
                    <ThumbsUp className="h-3 w-3 mr-1" /> Terpopuler
                  </TabsTrigger>
                  <TabsTrigger value="most_replies" className="text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" /> Terbanyak Balasan
                  </TabsTrigger>
                  <TabsTrigger value="trending" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" /> Trending
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Time frame options */}
            <div>
              <h4 className="text-xs font-medium mb-2 text-gray-500">
                Rentang waktu:
              </h4>
              <Tabs
                value={filters.timeFrame}
                onValueChange={handleTimeFrameChange}
                className="w-full"
              >
                <TabsList className="w-full grid grid-cols-5 h-8">
                  <TabsTrigger value="today" className="text-xs">
                    Hari ini
                  </TabsTrigger>
                  <TabsTrigger value="week" className="text-xs">
                    Minggu ini
                  </TabsTrigger>
                  <TabsTrigger value="month" className="text-xs">
                    Bulan ini
                  </TabsTrigger>
                  <TabsTrigger value="year" className="text-xs">
                    Tahun ini
                  </TabsTrigger>
                  <TabsTrigger value="all" className="text-xs">
                    Semua waktu
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Date Range */}
            <div>
              <h4 className="text-xs font-medium mb-2 text-gray-500">
                <Calendar className="h-3 w-3 inline mr-1" /> Rentang Tanggal:
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="dateFrom" className="text-xs">
                    Dari
                  </Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      handleDateChange("dateFrom", e.target.value)
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo" className="text-xs">
                    Sampai
                  </Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleDateChange("dateTo", e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              {filters.dateFrom && filters.dateTo && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-7 text-xs w-full"
                  onClick={() => {
                    performSearch();
                  }}
                >
                  Terapkan Filter Tanggal
                </Button>
              )}
            </div>

            {/* Author Search */}
            <div className="relative">
              <h4 className="text-xs font-medium mb-2 text-gray-500">
                <User className="h-3 w-3 inline mr-1" /> Cari berdasarkan
                Penulis:
              </h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Nama penulis..."
                  value={authorName}
                  onChange={handleAuthorSearch}
                  className="h-8 text-xs"
                />
                {filters.authorId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => {
                      setFilters({ ...filters, authorId: "" });
                      setAuthorName("");
                      performSearch();
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {showAuthorResults && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                  {authors.map((author) => (
                    <div
                      key={author.id}
                      className="px-3 py-2 text-xs hover:bg-gray-100 cursor-pointer"
                      onClick={() => selectAuthor(author.id, author.full_name)}
                    >
                      {author.full_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <h4 className="text-xs font-medium mb-2 text-gray-500">Tags:</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <TagBadge
                    key={tag.id}
                    tag={tag}
                    selected={selectedTags.includes(tag.id)}
                    onClick={() => toggleTag(tag.id)}
                    size="sm"
                    showUsageCount
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
