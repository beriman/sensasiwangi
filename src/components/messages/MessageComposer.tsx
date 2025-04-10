import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Image, X, Bold, Italic, Link, ShoppingBag, MapPin } from "lucide-react";
import { useConversation } from "@/contexts/ConversationContext";
import MessageReply from "./MessageReply";
import { supabase } from "../../lib/supabase";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import EmojiPicker from "./EmojiPicker";
import ProductShareButton from "./ProductShareButton";
import ProductShareCard from "./ProductShareCard";
import LocationShareButton from "./LocationShareButton";
import { MarketplaceProduct } from "@/types/marketplace";
import { filterMessageContent } from "@/lib/content-filter";
import ContentWarningDialog from "./ContentWarningDialog";
import SpamWarningDialog from "./SpamWarningDialog";
import AIModerationWarningDialog from "./AIModerationWarningDialog";
import { checkMessageForSpam, getSpamWarningMessage, recordUserMessage, logSpamViolation } from "@/lib/spam-detector";
import { moderateContent, getModerationWarningMessage, ContentModerationResult } from "@/lib/ai-content-moderator";

interface MessageComposerProps {
  onSendMessage: (content: string, imageUrl?: string, replyToMessageId?: string) => void;
  placeholder?: string;
}

export default function MessageComposer({
  onSendMessage,
  placeholder = "Tulis pesan...",
}: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [showContentWarning, setShowContentWarning] = useState(false);
  const [contentFilterResult, setContentFilterResult] = useState<{
    hasBadWords: boolean;
    hasPII: boolean;
    filteredText: string;
    badWords: string[];
    piiTypes: string[];
  } | null>(null);
  const [spamCheckResult, setSpamCheckResult] = useState<{
    isSpam: boolean;
    reason?: string;
  } | null>(null);
  const [aiModerationResult, setAiModerationResult] = useState<ContentModerationResult | null>(null);
  const [showSpamWarning, setShowSpamWarning] = useState(false);
  const [showAiWarning, setShowAiWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { editingMessage, setEditingMessage, replyToMessage, setReplyToMessage } = useConversation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setMessage(editor.getHTML());
    },
  });

  // Set initial content when editing a message
  useEffect(() => {
    if (editingMessage && editor) {
      editor.commands.setContent(editingMessage.content);
      setMessage(editingMessage.content);
      textareaRef.current?.focus();
    }
  }, [editingMessage, editor]);

  const checkContent = async () => {
    // Skip content check for images, products, or locations
    if (!message || message === "<p></p>" || selectedProduct || selectedLocation) {
      return false;
    }

    // Check message content for bad words and PII
    const result = filterMessageContent(message);
    setContentFilterResult(result);

    // Show warning if bad words or PII detected
    if (result.hasBadWords || result.hasPII) {
      setShowContentWarning(true);
      return true;
    }

    // Check for spam
    if (user) {
      const spamResult = checkMessageForSpam(user.id, message);
      setSpamCheckResult(spamResult);

      if (spamResult.isSpam) {
        setShowSpamWarning(true);
        return true;
      }
    }

    // Check with AI moderation
    try {
      const aiResult = await moderateContent(message);
      setAiModerationResult(aiResult);

      if (aiResult.flagged) {
        setShowAiWarning(true);
        return true;
      }
    } catch (error) {
      console.error("Error during AI moderation:", error);
      // Continue without AI moderation if it fails
    }

    return false;
  };

  const handleSend = async () => {
    if ((!message || message === "<p></p>") && !imageFile && !selectedProduct && !selectedLocation) return;

    // Check content before sending
    const hasContentIssues = await checkContent();
    if (hasContentIssues) {
      return; // Stop sending and show warning dialog
    }

    await sendMessage();
  };

  const sendMessage = async (useCensoredContent: boolean = false) => {
    let imageUrl = "";
    if (imageFile) {
      try {
        setIsUploading(true);
        const fileName = `${Date.now()}-${imageFile.name}`;
        const filePath = `message-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("messages")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("messages").getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setIsUploading(false);
      }
    }

    // Prepare the final message content
    let finalMessage = useCensoredContent && contentFilterResult
      ? contentFilterResult.filteredText
      : message;

    // If a product is selected, create a product share message
    if (selectedProduct) {
      // Create a product share message with JSON data
      const productData = {
        type: "product_share",
        product: {
          id: selectedProduct.id,
          name: selectedProduct.name,
          price: selectedProduct.price,
          image_url: selectedProduct.image_url,
        }
      };

      // Add product data as a hidden JSON string that will be parsed by the message renderer
      finalMessage = `<div data-product-share='${JSON.stringify(productData)}'></div>${finalMessage}`;
    }

    // If a location is selected, create a location share message
    if (selectedLocation) {
      // Create a location share message with JSON data
      const locationData = {
        type: "location_share",
        location: {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          address: selectedLocation.address
        }
      };

      // Add location data as a hidden JSON string that will be parsed by the message renderer
      finalMessage = `<div data-location-share='${JSON.stringify(locationData)}'></div>${finalMessage}`;
    }

    // Send message with reply info if replying
    onSendMessage(finalMessage, imageUrl, replyToMessage?.id);

    // Record message for spam detection
    if (user) {
      recordUserMessage(user.id, finalMessage);

      // Log spam violation if detected
      if (spamCheckResult?.isSpam) {
        logSpamViolation(
          user.id,
          finalMessage,
          spamCheckResult.reason || "unknown",
          replyToMessage?.conversation_id || ""
        );
      }
    }

    // Reset all states
    setMessage("");
    setImagePreview(null);
    setImageFile(null);
    setSelectedProduct(null);
    setSelectedLocation(null);
    setReplyToMessage(null);
    setContentFilterResult(null);
    setSpamCheckResult(null);
    setAiModerationResult(null);
    if (editor) {
      editor.commands.clearContent();
    }
    setEditingMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    if (editor) {
      editor.commands.insertContent(emoji.native);
    } else {
      setMessage((prev) => prev + emoji.native);
    }
  };

  return (
    <div className="border-t border-gray-200 p-4">
      {/* Content Warning Dialog */}
      <ContentWarningDialog
        open={showContentWarning}
        onOpenChange={setShowContentWarning}
        onProceed={() => {
          setShowContentWarning(false);
          sendMessage(true); // Send with censored content
        }}
        onCancel={() => {
          setShowContentWarning(false);
        }}
        hasBadWords={contentFilterResult?.hasBadWords || false}
        hasPII={contentFilterResult?.hasPII || false}
        badWords={contentFilterResult?.badWords || []}
        piiTypes={contentFilterResult?.piiTypes || []}
      />

      {/* Spam Warning Dialog */}
      <SpamWarningDialog
        open={showSpamWarning}
        onOpenChange={setShowSpamWarning}
        onProceed={() => {
          setShowSpamWarning(false);
          sendMessage(); // Send anyway
        }}
        onCancel={() => {
          setShowSpamWarning(false);
        }}
        warningMessage={spamCheckResult ? getSpamWarningMessage(spamCheckResult.reason) : ""}
      />

      {/* AI Moderation Warning Dialog */}
      <AIModerationWarningDialog
        open={showAiWarning}
        onOpenChange={setShowAiWarning}
        onProceed={() => {
          setShowAiWarning(false);
          sendMessage(); // Send anyway
        }}
        onCancel={() => {
          setShowAiWarning(false);
        }}
        moderationResult={aiModerationResult}
        warningMessage={aiModerationResult ? getModerationWarningMessage(aiModerationResult.categories) : ""}
      />
      {/* Reply Preview */}
      {replyToMessage && (
        <div className="relative mb-2">
          <MessageReply replyToMessage={replyToMessage} />
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gray-200 hover:bg-gray-300"
            onClick={() => setReplyToMessage(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="relative inline-block mb-2">
          <img
            src={imagePreview}
            alt="Preview"
            className="h-20 w-20 object-cover rounded-md"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={() => {
              setImagePreview(null);
              setImageFile(null);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Product Preview */}
      {selectedProduct && (
        <div className="relative inline-block mb-2 max-w-[200px]">
          <ProductShareCard product={selectedProduct} compact />
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={() => setSelectedProduct(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Location Preview */}
      {selectedLocation && (
        <div className="relative mb-2 p-3 bg-gray-50 rounded-md max-w-[300px]">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-sm font-medium">Lokasi Dibagikan</p>
              <p className="text-xs text-gray-600 break-words">{selectedLocation.address}</p>
            </div>
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={() => setSelectedLocation(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          {editor ? (
            <div className="border rounded-md focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent">
              <div className="flex items-center border-b px-3 py-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  data-active={editor.isActive("bold") ? "true" : "false"}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  data-active={editor.isActive("italic") ? "true" : "false"}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    const url = window.prompt("URL");
                    if (url) {
                      editor
                        .chain()
                        .focus()
                        .extendMarkRange("link")
                        .setLink({ href: url })
                        .run();
                    }
                  }}
                  data-active={editor.isActive("link") ? "true" : "false"}
                >
                  <Link className="h-4 w-4" />
                </Button>
              </div>
              <EditorContent
                editor={editor}
                className="px-3 py-2 min-h-[80px] max-h-[200px] overflow-y-auto"
              />
            </div>
          ) : (
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[80px] resize-none"
            />
          )}
        </div>

        <div className="flex items-center gap-1">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image className="h-5 w-5" />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </Button>

          <ProductShareButton
            onSelectProduct={(product) => setSelectedProduct(product)}
          />

          <LocationShareButton
            onSelectLocation={(location) => setSelectedLocation(location)}
          />

          <Button
            onClick={handleSend}
            disabled={
              ((!message || message === "<p></p>") && !imageFile && !selectedProduct && !selectedLocation) || isUploading
            }
            className="rounded-full h-10 w-10 p-0 bg-purple-600 hover:bg-purple-700"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
