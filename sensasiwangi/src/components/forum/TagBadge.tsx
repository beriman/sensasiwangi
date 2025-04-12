// @ts-ignore
import React from "react";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { ForumTag } from "../../types/forum";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";

interface TagBadgeProps {
  tag: ForumTag;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
  showUsageCount?: boolean;
}

export default function TagBadge({
  tag,
  selected = false,
  onClick,
  size = "md",
  showDescription = false,
  showUsageCount = false,
}: TagBadgeProps) {
  const sizeClasses = {
    sm: "text-xs py-0 px-2",
    md: "text-sm py-0.5 px-2",
    lg: "text-base py-1 px-3",
  };

  const badgeContent = (
    <Badge
      className={`${sizeClasses[size]} ${onClick ? "cursor-pointer" : ""}`}
      style={{
        backgroundColor: selected ? tag.color : `${tag.color}20`,
        color: selected ? "white" : tag.color,
        borderColor: tag.color,
      }}
      variant={selected ? "default" : "outline"}
      onClick={onClick}
    >
      {tag.name}
      {showUsageCount && tag.usage_count !== undefined && (
        <span className="ml-1 text-xs opacity-80">({tag.usage_count})</span>
      )}
    </Badge>
  );

  // If showing description or it's a custom tag, wrap in tooltip
  if ((showDescription && tag.description) || tag.user_id) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
          <TooltipContent side="top" align="center" className="max-w-xs">
            <div className="space-y-1">
              {tag.description && <p className="text-sm">{tag.description}</p>}
              {tag.user_id && (
                <p className="text-xs text-gray-500">Custom tag</p>
              )}
              {tag.category && (
                <p className="text-xs text-gray-500">
                  Category: {tag.category}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeContent;
}


