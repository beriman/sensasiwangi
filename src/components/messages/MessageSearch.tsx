import React, { useState } from "react";
import { Search, X, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PrivateMessage } from "@/types/messages";

interface MessageSearchProps {
  messages: PrivateMessage[];
  onResultSelect: (messageId: string) => void;
}

export default function MessageSearch({
  messages,
  onResultSelect,
}: MessageSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PrivateMessage[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const results = messages.filter((message) =>
      message.content.toLowerCase().includes(term)
    );
    
    setSearchResults(results);
    setSelectedResultIndex(results.length > 0 ? 0 : -1);
    
    if (results.length > 0) {
      onResultSelect(results[0].id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const navigateResults = (direction: "up" | "down") => {
    if (searchResults.length === 0) return;

    let newIndex;
    if (direction === "up") {
      newIndex = selectedResultIndex > 0 
        ? selectedResultIndex - 1 
        : searchResults.length - 1;
    } else {
      newIndex = selectedResultIndex < searchResults.length - 1 
        ? selectedResultIndex + 1 
        : 0;
    }

    setSelectedResultIndex(newIndex);
    onResultSelect(searchResults[newIndex].id);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setIsSearching(false);
  };

  return (
    <div className="relative">
      {isSearching ? (
        <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 p-2 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari dalam percakapan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-8 h-8 text-sm"
              autoFocus
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {searchResults.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {selectedResultIndex + 1}/{searchResults.length}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateResults("up")}
              disabled={searchResults.length === 0}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateResults("down")}
              disabled={searchResults.length === 0}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 absolute top-2 right-2 z-10"
          onClick={() => setIsSearching(true)}
        >
          <Search className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
