import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Image, Paperclip, Smile } from "lucide-react";

interface MessageComposerProps {
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export default function MessageComposer({
  onSendMessage,
  isLoading = false,
  placeholder = "Tulis pesan...",
}: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150,
      )}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 bg-white p-4"
    >
      <div className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="resize-none min-h-[40px] max-h-[150px] pr-10 py-2"
            disabled={isLoading}
          />
          <div className="absolute right-2 bottom-2 flex space-x-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          type="submit"
          size="icon"
          className="h-10 w-10 rounded-full bg-purple-500 hover:bg-purple-600"
          disabled={!message.trim() || isLoading}
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
}
