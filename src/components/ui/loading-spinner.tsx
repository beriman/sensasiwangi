import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  text = "Loading...",
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <Loader2 className={`${sizeClasses[size]} text-purple-600 animate-spin`} />
      {text && <p className="mt-2 text-sm text-gray-500">{text}</p>}
    </div>
  );
}
