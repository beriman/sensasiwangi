import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Code,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AtSign,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import DOMPurify from "dompurify";
import { supabase } from "../../../supabase/supabase";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface UserSuggestion {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Write something...",
  disabled = false,
  className = "",
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [isImagePopoverOpen, setIsImagePopoverOpen] = useState(false);
  const [isMentionPopoverOpen, setIsMentionPopoverOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-purple-600 underline hover:text-purple-800",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-md max-w-full my-4",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
    ],
    content: content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      // Sanitize HTML before passing it to the parent component
      const sanitizedHtml = DOMPurify.sanitize(editor.getHTML());
      onChange(sanitizedHtml);
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const addLink = () => {
    if (!linkUrl) return;

    // Check if URL has protocol, if not add https://
    let url = linkUrl;
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
    setLinkUrl("");
    setIsLinkPopoverOpen(false);
  };

  const addImage = () => {
    if (!imageUrl) return;
    editor?.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl("");
    setIsImagePopoverOpen(false);
  };

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setUserSuggestions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, full_name, avatar_url")
        .ilike("username", `%${query}%`)
        .limit(5);

      if (error) throw error;
      setUserSuggestions(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      setUserSuggestions([]);
    }
  };

  const insertMention = (username: string) => {
    if (!editor) return;

    // Insert the mention as a span with a data attribute
    editor
      .chain()
      .focus()
      .insertContent(
        `<span class="mention" data-mention="${username}">@${username}</span> `,
      )
      .run();

    setIsMentionPopoverOpen(false);
    setMentionQuery("");
  };

  const handleMentionSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setMentionQuery(query);
    searchUsers(query);
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={`border rounded-md ${className}`}>
      <div className="bg-gray-50 p-2 border-b flex flex-wrap gap-1 items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`px-2 ${editor.isActive("bold") ? "bg-gray-200" : ""}`}
                disabled={disabled}
              >
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`px-2 ${editor.isActive("italic") ? "bg-gray-200" : ""}`}
                disabled={disabled}
              >
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`px-2 ${editor.isActive("strike") ? "bg-gray-200" : ""}`}
                disabled={disabled}
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Strikethrough</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={`px-2 ${editor.isActive("code") ? "bg-gray-200" : ""}`}
                disabled={disabled}
              >
                <Code className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Code</TooltipContent>
          </Tooltip>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className={`px-2 ${editor.isActive("heading", { level: 1 }) ? "bg-gray-200" : ""}`}
                disabled={disabled}
              >
                <Heading1 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heading 1</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className={`px-2 ${editor.isActive("heading", { level: 2 }) ? "bg-gray-200" : ""}`}
                disabled={disabled}
              >
                <Heading2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heading 2</TooltipContent>
          </Tooltip>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`px-2 ${editor.isActive("bulletList") ? "bg-gray-200" : ""}`}
                disabled={disabled}
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`px-2 ${editor.isActive("orderedList") ? "bg-gray-200" : ""}`}
                disabled={disabled}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ordered List</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`px-2 ${editor.isActive("blockquote") ? "bg-gray-200" : ""}`}
                disabled={disabled}
              >
                <Quote className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Quote</TooltipContent>
          </Tooltip>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`px-2 ${editor.isActive("link") ? "bg-gray-200" : ""}`}
                      disabled={disabled}
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Link</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-2">
                <h4 className="font-medium">Add Link</h4>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLinkPopoverOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={addLink}>
                    Add Link
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover
            open={isImagePopoverOpen}
            onOpenChange={setIsImagePopoverOpen}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2"
                      disabled={disabled}
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Image</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-2">
                <h4 className="font-medium">Add Image</h4>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImagePopoverOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={addImage}>
                    Add Image
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Mention User Popover */}
          <Popover
            open={isMentionPopoverOpen}
            onOpenChange={setIsMentionPopoverOpen}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2"
                      disabled={disabled}
                    >
                      <AtSign className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Mention User</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-2">
                <h4 className="font-medium">Mention User</h4>
                <Input
                  type="text"
                  placeholder="Search username..."
                  value={mentionQuery}
                  onChange={handleMentionSearch}
                />
                {userSuggestions.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
                    {userSuggestions.map((user) => (
                      <div
                        key={user.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                        onClick={() => insertMention(user.username)}
                      >
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-medium text-gray-500">
                              {user.username[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            @{user.username}
                          </div>
                          {user.full_name && (
                            <div className="text-xs text-gray-500">
                              {user.full_name}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMentionPopoverOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="h-6 w-px bg-gray-300 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo() || disabled}
                className="px-2"
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo() || disabled}
                className="px-2"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[200px] focus:outline-none"
      />
    </div>
  );
}
