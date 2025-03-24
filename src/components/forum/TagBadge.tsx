import React from "react";
import { Badge } from "@/components/ui/badge";
import { ForumTag } from "@/types/forum";

interface TagBadgeProps {
  tag: ForumTag;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

export default function TagBadge({
  tag,
  selected = false,
  onClick,
  size = "md",
}: TagBadgeProps) {
  const sizeClasses = {
    sm: "text-xs py-0 px-2",
    md: "text-sm py-0.5 px-2",
    lg: "text-base py-1 px-3",
  };

  return (
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
    </Badge>
  );
}
