// @ts-ignore
import React, { useState, useEffect, useRef } from "react";
// @ts-ignore
import { Input } from "./input";
// @ts-ignore
import { Search as SearchIcon, X, Loader2 } from "lucide-react";
// @ts-ignore
import { Button } from "./button";
// @ts-ignore
import { cn } from "../../lib/utils";

interface SearchProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  initialValue?: string;
  loading?: boolean;
  className?: string;
}

export function Search({
  placeholder = "Search...",
  onSearch,
  initialValue = "",
  loading = false,
  className = "",
}: SearchProps) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handle input change with debounce
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Clear any existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set a new timeout
    debounceTimeout.current = setTimeout(() => {
      setDebouncedValue(newValue);
    }, 300);
  };

  // Clear search
  const handleClear = () => {
    setValue("");
    setDebouncedValue("");
    onSearch("");
  };

  // Trigger search when debounced value changes
  useEffect(() => {
    onSearch(debouncedValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className="pl-10 pr-10 h-10 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        ) : value ? (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4 text-gray-400" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}


