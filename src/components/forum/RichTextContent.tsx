import React from "react";
import DOMPurify from "dompurify";

interface RichTextContentProps {
  content: string;
  className?: string;
}

export default function RichTextContent({
  content,
  className = "",
}: RichTextContentProps) {
  // Sanitize HTML content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(content);

  return (
    <div
      className={`prose max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
