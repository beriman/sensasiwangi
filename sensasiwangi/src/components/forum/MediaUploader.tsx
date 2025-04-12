// @ts-ignore
import React, { useState } from "react";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Input } from "../../components/ui/input";
// @ts-ignore
import { Image, Youtube, FileVideo, X, Upload } from "lucide-react";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";
// @ts-ignore
import { supabase } from "../../../supabase/supabase";

interface MediaUploaderProps {
  onMediaAdd: (url: string) => void;
  onMediaRemove: (url: string) => void;
  mediaUrls: string[];
}

export default function MediaUploader({
  onMediaAdd,
  onMediaRemove,
  mediaUrls,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File terlalu besar",
        description: "Ukuran file maksimal 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Format file tidak didukung",
        description: "Silakan pilih file gambar (JPG, PNG, GIF).",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `forum/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("forum-media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("forum-media")
        .getPublicUrl(filePath);

      onMediaAdd(publicUrlData.publicUrl);

      toast({
        title: "Upload berhasil",
        description: "Gambar telah ditambahkan.",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Gagal mengunggah gambar. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Clear the input
      e.target.value = "";
    }
  };

  const handleUrlAdd = () => {
    if (!mediaUrl) return;

    // Simple validation for YouTube, Vimeo, TikTok URLs
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    const vimeoRegex = /^(https?:\/\/)?(www\.)?(vimeo\.com)\/.+$/;
    const tiktokRegex = /^(https?:\/\/)?(www\.)?(tiktok\.com)\/.+$/;
    const imageRegex = /\.(jpeg|jpg|gif|png)$/i;

    if (
      !youtubeRegex.test(mediaUrl) &&
      !vimeoRegex.test(mediaUrl) &&
      !tiktokRegex.test(mediaUrl) &&
      !imageRegex.test(mediaUrl)
    ) {
      toast({
        title: "URL tidak valid",
        description:
          "Silakan masukkan URL YouTube, Vimeo, TikTok, atau gambar yang valid.",
        variant: "destructive",
      });
      return;
    }

    onMediaAdd(mediaUrl);
    setMediaUrl("");

    toast({
      title: "Media ditambahkan",
      description: "URL media telah ditambahkan.",
    });
  };

  const getMediaType = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return "youtube";
    } else if (url.includes("vimeo.com")) {
      return "vimeo";
    } else if (url.includes("tiktok.com")) {
      return "tiktok";
    } else if (/\.(jpeg|jpg|gif|png)$/i.test(url)) {
      return "image";
    }
    return "unknown";
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "youtube":
      case "vimeo":
      case "tiktok":
        return <Youtube className="h-4 w-4 text-red-500" />;
      case "image":
        return <Image className="h-4 w-4 text-blue-500" />;
      default:
        return <FileVideo className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Tambahkan Media
        </label>
        <div className="flex space-x-2">
          <div className="relative">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="file-upload"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("file-upload")?.click()}
              disabled={uploading}
              className="h-9"
            >
              {uploading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload Gambar
            </Button>
          </div>
          <div className="flex-1 flex space-x-2">
            <Input
              placeholder="URL YouTube, Vimeo, TikTok, atau gambar"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleUrlAdd}
              disabled={!mediaUrl}
              className="h-9"
            >
              Tambah URL
            </Button>
          </div>
        </div>
      </div>

      {mediaUrls.length > 0 && (
        <div className="border border-gray-200 rounded-md p-2">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Media Terlampir:
          </div>
          <div className="flex flex-wrap gap-2">
            {mediaUrls.map((url, index) => {
              const mediaType = getMediaType(url);
              return (
                <div
                  key={index}
                  className="flex items-center bg-gray-100 rounded-md px-2 py-1 text-sm"
                >
                  {getMediaIcon(mediaType)}
                  <span className="mx-2 truncate max-w-[150px]">
                    {mediaType === "image" ? "Image" : url.split("/").pop()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMediaRemove(url)}
                    className="h-6 w-6 p-0 hover:bg-gray-200"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


