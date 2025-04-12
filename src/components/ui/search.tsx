// @ts-ignore
import * as React from "react";
// @ts-ignore
import { cn } from "../../lib/utils";
// @ts-ignore
import { Input, InputProps } from "./input";
// @ts-ignore
import { Search as SearchIcon, X } from "lucide-react";
// @ts-ignore
import { Button } from "./button";

export interface SearchProps extends InputProps {
  onSearch?: (value: string) => void;
  onClear?: () => void;
  loading?: boolean;
}

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  ({ className, onSearch, onClear, loading = false, ...props }, ref) => {
    const [value, setValue] = React.useState(
      props.value || props.defaultValue || "",
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      props.onChange?.(e);

      // If search callback is provided, call it after a short delay
      if (onSearch) {
        const handler = setTimeout(() => {
          onSearch(newValue);
        }, 300);
        return () => clearTimeout(handler);
      }
    };

    const handleClear = () => {
      setValue("");
      onClear?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && onSearch) {
        onSearch(value as string);
      }
      props.onKeyDown?.(e);
    };

    return (
      <div className={cn("relative", className)}>
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          className="pl-10 pr-10"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          {...props}
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="absolute right-0 top-0 h-full rounded-l-none px-3 py-1"
            onClick={handleClear}
            disabled={loading}
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <X className="h-4 w-4" />
            )}
            <span className="sr-only">Clear</span>
          </Button>
        )}
      </div>
    );
  },
);

Search.displayName = "Search";

export { Search };


