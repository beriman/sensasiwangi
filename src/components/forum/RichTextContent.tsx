import React, { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { Link } from "react-router-dom";
import { supabase } from "../../../supabase/supabase";

interface RichTextContentProps {
  content: string;
  className?: string;
}

interface MentionedUser {
  id: string;
  username: string;
  full_name?: string;
}

export default function RichTextContent({
  content,
  className = "",
}: RichTextContentProps) {
  const [processedContent, setProcessedContent] = useState("");
  const [mentionedUsers, setMentionedUsers] = useState<
    Record<string, MentionedUser>
  >({});

  useEffect(() => {
    // Extract all mentioned usernames from the content
    const mentionRegex =
      /<span class="mention" data-mention="([^"]+)">@([^<]+)<\/span>/g;
    const mentions = Array.from(content.matchAll(mentionRegex));
    const usernames = [...new Set(mentions.map((match) => match[1]))]; // Get unique usernames

    // If there are mentions, fetch user data
    if (usernames.length > 0) {
      const fetchMentionedUsers = async () => {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("id, username, full_name")
            .in("username", usernames);

          if (error) throw error;

          // Create a map of username -> user data
          const usersMap: Record<string, MentionedUser> = {};
          (data || []).forEach((user) => {
            usersMap[user.username] = user;
          });

          setMentionedUsers(usersMap);
        } catch (error) {
          console.error("Error fetching mentioned users:", error);
        }
      };

      fetchMentionedUsers();
    }
  }, [content]);

  useEffect(() => {
    // Process content to replace mention spans with links
    let newContent = content;
    const mentionRegex =
      /<span class="mention" data-mention="([^"]+)">@([^<]+)<\/span>/g;

    // Replace each mention with a link if the user exists
    newContent = newContent.replace(mentionRegex, (match, username) => {
      const user = mentionedUsers[username];
      if (user) {
        // Return a link to the user's profile
        return `<a href="/profile/${user.id}" class="mention-link">@${username}</a>`;
      }
      // If user not found, keep the original mention
      return `@${username}`;
    });

    // Sanitize the final HTML
    const sanitizedContent = DOMPurify.sanitize(newContent, {
      ALLOWED_TAGS: [
        "a",
        "b",
        "i",
        "em",
        "strong",
        "p",
        "br",
        "ul",
        "ol",
        "li",
        "blockquote",
        "h1",
        "h2",
        "h3",
        "img",
        "pre",
        "code",
        "span",
      ],
      ALLOWED_ATTR: ["href", "src", "alt", "class", "target", "rel"],
    });

    setProcessedContent(sanitizedContent);
  }, [content, mentionedUsers]);

  return (
    <div
      className={`prose max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}
