import React from "react";
import { Card } from "@/components/ui/card";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export default function MarkdownPreview({
  content,
  className = "",
}: MarkdownPreviewProps) {
  // Function to convert markdown to HTML
  const renderMarkdown = (text: string) => {
    if (!text) return "";

    let html = text;

    // Convert bold
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Convert italic
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Convert links
    html = html.replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-purple-600 hover:underline">$1</a>',
    );

    // Convert images
    html = html.replace(
      /!\[(.*?)\]\((.*?)\)/g,
      '<img src="$2" alt="$1" class="max-w-full rounded-md my-2" />',
    );

    // Convert quotes
    html = html.replace(
      /^>\s*(.*?)$/gm,
      '<blockquote class="border-l-4 border-gray-300 pl-4 py-1 my-2 text-gray-600 italic">$1</blockquote>',
    );

    // Convert paragraphs (must be done last)
    html = html
      .split("\n\n")
      .map((paragraph) => {
        if (
          paragraph.trim() &&
          !paragraph.startsWith("<blockquote") &&
          !paragraph.startsWith("<img")
        ) {
          return `<p class="my-2">${paragraph}</p>`;
        }
        return paragraph;
      })
      .join("");

    return html;
  };

  return (
    <Card
      className={`p-4 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl overflow-auto ${className}`}
    >
      <div
        className="prose max-w-none text-gray-800"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
      {!content && (
        <p className="text-gray-400 italic">Preview akan muncul di sini...</p>
      )}
    </Card>
  );
}
