import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Smile,
  Video,
  FileText,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Paperclip,
  X,
  Eye,
  Youtube
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  onImageUpload?: (url: string) => void;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your content here...",
  minHeight = "200px",
  maxHeight = "500px",
  onImageUpload
}: RichTextEditorProps) {
  const { toast } = useToast();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [selectedTab, setSelectedTab] = useState<string>("write");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Link insertion state
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [linkText, setLinkText] = useState<string>("");
  const [linkPopoverOpen, setLinkPopoverOpen] = useState<boolean>(false);

  // Image insertion state
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageAlt, setImageAlt] = useState<string>("");
  const [imagePopoverOpen, setImagePopoverOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // YouTube insertion state
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [youtubePopoverOpen, setYoutubePopoverOpen] = useState<boolean>(false);

  // Emoji insertion state
  const [emojiPopoverOpen, setEmojiPopoverOpen] = useState<boolean>(false);

  // Common emojis for quick access
  const commonEmojis = [
    "😀", "😂", "😊", "😍", "🤔", "😎", "👍", "👏", "🙏", "❤️",
    "🔥", "✨", "⭐", "🎉", "🎊", "🎁", "🌟", "💯", "🤩", "😇",
    "🤗", "🤭", "🤫", "🤐", "😏", "😒", "😞", "😔", "😟", "😕",
    "🙂", "🙃", "😉", "😌", "😜", "😝", "😛", "🤑", "🤗", "🤓"
  ];

  // Update preview when content changes
  useEffect(() => {
    if (selectedTab === "preview") {
      // In a real implementation, you would use a proper markdown/HTML parser
      // This is a simplified version for demonstration
      let html = value
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/```(.*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-md" />')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-500 hover:underline">$1</a>')
        .replace(/#{3}(.*?)$/gm, '<h3 class="text-lg font-semibold">$1</h3>')
        .replace(/#{2}(.*?)$/gm, '<h2 class="text-xl font-semibold">$1</h2>')
        .replace(/#{1}(.*?)$/gm, '<h1 class="text-2xl font-bold">$1</h1>')
        .replace(/> (.*?)$/gm, '<blockquote class="pl-4 border-l-4 border-gray-200 italic">$1</blockquote>')
        .replace(/\n/g, '<br />');

      // Preserve HTML elements like YouTube embeds
      // This is a simple approach - in a real implementation you'd use a proper HTML parser
      if (value.includes('<div class="youtube-embed">')) {
        // Extract YouTube embeds
        const youtubeRegex = /<div class="youtube-embed">[\s\S]*?<\/div>/g;
        const youtubeMatches = value.match(youtubeRegex);

        if (youtubeMatches) {
          youtubeMatches.forEach(embed => {
            html += embed;
          });
        }
      }

      setPreviewHtml(html);
    }
  }, [value, selectedTab]);

  const insertTextAtCursor = (textBefore: string, textAfter: string = "") => {
    if (!editorRef.current) return;

    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + textBefore + selectedText + textAfter + value.substring(end);

    onChange(newText);

    // Set cursor position after the operation
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + textBefore.length,
        start + textBefore.length + selectedText.length
      );
    }, 0);
  };

  const handleToolbarAction = (action: string) => {
    switch (action) {
      case "bold":
        insertTextAtCursor("**", "**");
        break;
      case "italic":
        insertTextAtCursor("*", "*");
        break;
      case "underline":
        insertTextAtCursor("__", "__");
        break;
      case "h1":
        insertTextAtCursor("# ");
        break;
      case "h2":
        insertTextAtCursor("## ");
        break;
      case "ul":
        insertTextAtCursor("- ");
        break;
      case "ol":
        insertTextAtCursor("1. ");
        break;
      case "quote":
        insertTextAtCursor("> ");
        break;
      case "code":
        insertTextAtCursor("`", "`");
        break;
      case "codeblock":
        insertTextAtCursor("```\n", "\n```");
        break;
      case "link":
        setLinkPopoverOpen(true);
        break;
      case "image":
        setImagePopoverOpen(true);
        break;
      case "youtube":
        setYoutubePopoverOpen(true);
        break;
      case "emoji":
        setEmojiPopoverOpen(true);
        break;
      default:
        break;
    }
  };

  const handleInsertLink = () => {
    if (linkUrl) {
      const linkMarkdown = `[${linkText || linkUrl}](${linkUrl})`;
      insertTextAtCursor(linkMarkdown);
      setLinkUrl("");
      setLinkText("");
      setLinkPopoverOpen(false);
    }
  };

  const handleInsertImage = () => {
    if (imageUrl) {
      const imageMarkdown = `![${imageAlt || "Image"}](${imageUrl})`;
      insertTextAtCursor(imageMarkdown);
      setImageUrl("");
      setImageAlt("");
      setImagePopoverOpen(false);

      if (onImageUpload) {
        onImageUpload(imageUrl);
      }
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    insertTextAtCursor(emoji);
    setEmojiPopoverOpen(false);
  };

  const handleInsertYoutube = () => {
    if (youtubeUrl) {
      // Extract video ID from YouTube URL
      let videoId = "";
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
      const match = youtubeUrl.match(youtubeRegex);

      if (match && match[1]) {
        videoId = match[1];

        // Create YouTube embed HTML
        const youtubeEmbed = `<div class="youtube-embed">
  <iframe
    width="560"
    height="315"
    src="https://www.youtube.com/embed/${videoId}"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
  ></iframe>
</div>`;

        insertTextAtCursor(youtubeEmbed);
        setYoutubeUrl("");
        setYoutubePopoverOpen(false);

        toast({
          title: "YouTube video added",
          description: "The video will be displayed in the preview and when posted",
        });
      } else {
        toast({
          title: "Invalid YouTube URL",
          description: "Please enter a valid YouTube URL",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `forum_images/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploadProgress(percent);
          },
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Insert image markdown
      const imageMarkdown = `![${file.name}](${publicUrl})`;
      insertTextAtCursor(imageMarkdown);

      if (onImageUpload) {
        onImageUpload(publicUrl);
      }

      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList>
            <TabsTrigger value="write" className="flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="write" className="space-y-2">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-gray-50 border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleToolbarAction("bold")}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleToolbarAction("italic")}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleToolbarAction("underline")}
              title="Underline"
            >
              <Underline className="h-4 w-4" />
            </Button>

            <div className="h-4 w-px bg-gray-300 mx-1" />

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleToolbarAction("h1")}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleToolbarAction("h2")}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>

            <div className="h-4 w-px bg-gray-300 mx-1" />

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleToolbarAction("ul")}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleToolbarAction("ol")}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleToolbarAction("quote")}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </Button>

            <div className="h-4 w-px bg-gray-300 mx-1" />

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleToolbarAction("code")}
              title="Inline Code"
            >
              <Code className="h-4 w-4" />
            </Button>

            <div className="h-4 w-px bg-gray-300 mx-1" />

            <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Insert Link"
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Insert Link</h4>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="linkText">Link Text</Label>
                      <Input
                        id="linkText"
                        placeholder="Text to display"
                        value={linkText}
                        onChange={(e) => setLinkText(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="linkUrl">URL</Label>
                      <Input
                        id="linkUrl"
                        placeholder="https://example.com"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setLinkPopoverOpen(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleInsertLink} disabled={!linkUrl}>
                        Insert
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={imagePopoverOpen} onOpenChange={setImagePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Insert Image"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </Popover>

            <Popover open={youtubePopoverOpen} onOpenChange={setYoutubePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Insert YouTube Video"
                  onClick={() => handleToolbarAction("youtube")}
                >
                  <Youtube className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Insert YouTube Video</h4>
                  <div className="space-y-1">
                    <Label htmlFor="youtubeUrl">YouTube URL</Label>
                    <Input
                      id="youtubeUrl"
                      placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setYoutubePopoverOpen(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleInsertYoutube} disabled={!youtubeUrl}>
                      Insert
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={imagePopoverOpen} onOpenChange={setImagePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Insert Image"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Insert Image</h4>
                  <Tabs defaultValue="url" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="url">Image URL</TabsTrigger>
                      <TabsTrigger value="upload">Upload</TabsTrigger>
                    </TabsList>
                    <TabsContent value="url" className="space-y-2">
                      <div className="space-y-1">
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input
                          id="imageUrl"
                          placeholder="https://example.com/image.jpg"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="imageAlt">Alt Text</Label>
                        <Input
                          id="imageAlt"
                          placeholder="Image description"
                          value={imageAlt}
                          onChange={(e) => setImageAlt(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setImagePopoverOpen(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleInsertImage} disabled={!imageUrl}>
                          Insert
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="upload" className="space-y-2">
                      <div className="space-y-1">
                        <Label htmlFor="imageUpload">Upload Image</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="imageUpload"
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            disabled={isUploading}
                          />
                        </div>
                        {isUploading && (
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Uploading: {uploadProgress}%</div>
                            <Progress value={uploadProgress} />
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={emojiPopoverOpen} onOpenChange={setEmojiPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Insert Emoji"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  <h4 className="font-medium">Insert Emoji</h4>
                  <div className="grid grid-cols-8 gap-1">
                    {commonEmojis.map((emoji, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-lg"
                        onClick={() => handleInsertEmoji(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="h-4 w-px bg-gray-300 mx-1" />

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
              title="Upload File"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
            />
          </div>

          {/* Editor */}
          <Textarea
            ref={editorRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[200px] font-mono"
            style={{ minHeight, maxHeight }}
          />

          <div className="text-xs text-gray-500">
            Supports Markdown formatting: **bold**, *italic*, [links](url), ![images](url), etc.
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardContent className="pt-6">
              {previewHtml ? (
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <div className="text-gray-500 italic">No content to preview</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Missing component imports
import { Progress } from "@/components/ui/progress";
import { Eye } from "lucide-react";
