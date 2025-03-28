import { useState, useEffect } from "react";
import { supabase } from "../../../supabase/supabase";
import { cn } from "@/lib/utils";

interface SupabaseImageProps {
  path: string;
  bucket: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

export function SupabaseImage({
  path,
  bucket,
  alt,
  className,
  width,
  height,
}: SupabaseImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.storage
          .from(bucket)
          .download(path);

        if (error) {
          throw error;
        }

        const url = URL.createObjectURL(data);
        setImageUrl(url);
      } catch (error: any) {
        console.error("Error downloading image:", error.message);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    if (path) {
      fetchImage();
    }

    return () => {
      // Clean up the object URL when the component unmounts
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [path, bucket]);

  if (loading) {
    return (
      <div
        className={cn("bg-gray-200 animate-pulse rounded", className)}
        style={{ width: width || "100%", height: height || "200px" }}
      />
    );
  }

  if (error || !imageUrl) {
    return (
      <div
        className={cn(
          "bg-gray-100 flex items-center justify-center text-gray-500 rounded",
          className,
        )}
        style={{ width: width || "100%", height: height || "200px" }}
      >
        Image not available
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={cn("object-cover rounded", className)}
      width={width}
      height={height}
    />
  );
}
