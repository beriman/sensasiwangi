import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Image, X, Smile, Bold, Italic, Link } from "lucide-react";
import { useConversation } from "@/contexts/ConversationContext";
import { supabase } from "../../../supabase/supabase";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

interface MessageComposerProps {
  onSendMessage: (content: string, imageUrl?: string) => void;
  placeholder?: string;
}

export default function MessageComposer({
  onSendMessage,
  placeholder = "Tulis pesan...",
}: MessageComposerProps) {
  const {
    isSendingMessage: isLoading,
    editingMessage,
    editMessage,
    setEditingMessage,
  } = useConversation();
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRichTextMode, setIsRichTextMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-purple-600 underline",
        },
      }),
      Placeholder.configure({
        placeholder: editingMessage
          ? "Edit your message..."
          : imageFile
            ? "Add a caption..."
            : placeholder,
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setMessage(editor.getHTML());
    },
  });

  // Set message content when editing a message
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content);
      if (isRichTextMode && editor) {
        editor.commands.setContent(editingMessage.content);
        editor.commands.focus();
      } else if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [editingMessage, editor, isRichTextMode]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150,
      )}px`;
    }
  }, [message]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      setIsUploading(true);
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `message_images/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("messages")
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        return null;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("messages").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error in image upload:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage =
      isRichTextMode && editor ? editor.getHTML().trim() : message.trim();

    if ((!trimmedMessage && !imageFile) || isLoading || isUploading) return;

    try {
      // If we're editing a message
      if (editingMessage) {
        await editMessage(editingMessage.id, trimmedMessage);
        setMessage("");
        if (isRichTextMode && editor) {
          editor.commands.setContent("");
        }
        return;
      }

      // Otherwise, send a new message
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      onSendMessage(trimmedMessage, imageUrl || undefined);
      setMessage("");
      if (isRichTextMode && editor) {
        editor.commands.setContent("");
      }
      removeImage();
    } catch (error) {
      console.error("Error sending/editing message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setMessage("");
    if (isRichTextMode && editor) {
      editor.commands.setContent("");
    }
  };

  const toggleRichTextMode = () => {
    setIsRichTextMode(!isRichTextMode);
    if (!isRichTextMode && editor) {
      // Switching to rich text mode, transfer content from textarea
      editor.commands.setContent(message);
    }
  };

  const toggleBold = () => {
    editor?.chain().focus().toggleBold().run();
  };

  const toggleItalic = () => {
    editor?.chain().focus().toggleItalic().run();
  };

  const toggleLink = () => {
    const url = window.prompt("URL");
    if (url) {
      editor?.chain().focus().toggleLink({ href: url }).run();
    } else if (editor?.isActive("link")) {
      editor?.chain().focus().unsetLink().run();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 bg-white p-4"
    >
      {editingMessage && (
        <div className="mb-2 flex items-center justify-between bg-gray-50 p-2 rounded-md">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Editing message</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={cancelEditing}
            className="text-xs"
          >
            Cancel
          </Button>
        </div>
      )}

      {imagePreview && (
        <div className="mb-2 relative inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            className="h-20 w-auto rounded-md object-cover"
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={removeImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      <div className="flex items-end space-x-2">
        <div className="flex-1 relative">
          {isRichTextMode ? (
            <div className="border rounded-md overflow-hidden">
              <div className="flex items-center space-x-1 p-1 border-b bg-gray-50">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className={`h-6 w-6 ${editor?.isActive("bold") ? "bg-gray-200" : ""}`}
                  onClick={toggleBold}
                  disabled={isLoading || isUploading}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className={`h-6 w-6 ${editor?.isActive("italic") ? "bg-gray-200" : ""}`}
                  onClick={toggleItalic}
                  disabled={isLoading || isUploading}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className={`h-6 w-6 ${editor?.isActive("link") ? "bg-gray-200" : ""}`}
                  onClick={toggleLink}
                  disabled={isLoading || isUploading}
                >
                  <Link className="h-4 w-4" />
                </Button>
              </div>
              <EditorContent
                editor={editor}
                className="resize-none min-h-[40px] max-h-[150px] p-2 overflow-auto"
              />
            </div>
          ) : (
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                imageFile
                  ? "Add a caption..."
                  : editingMessage
                    ? "Edit your message..."
                    : placeholder
              }
              className="resize-none min-h-[40px] max-h-[150px] pr-20 py-2"
              disabled={isLoading || isUploading}
            />
          )}
          <div className="absolute right-2 bottom-2 flex space-x-1">
            {!editingMessage && (
              <>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-gray-400 hover:text-gray-600"
                  onClick={triggerFileInput}
                  disabled={isLoading || isUploading}
                >
                  <Image className="h-4 w-4" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                  disabled={isLoading || isUploading}
                />
              </>
            )}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={`h-6 w-6 ${isRichTextMode ? "bg-purple-100 text-purple-600" : "text-gray-400 hover:text-gray-600"}`}
              onClick={toggleRichTextMode}
              disabled={isLoading || isUploading}
              title={
                isRichTextMode ? "Switch to plain text" : "Switch to rich text"
              }
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-gray-400 hover:text-gray-600"
              disabled={isLoading || isUploading}
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          type="submit"
          size="icon"
          className="h-10 w-10 rounded-full bg-purple-500 hover:bg-purple-600"
          disabled={(!message.trim() && !imageFile) || isLoading || isUploading}
        >
          {isLoading || isUploading ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
}
