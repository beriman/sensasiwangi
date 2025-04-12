import React, { useState } from "react";
import { 
  Share2, 
  Twitter, 
  Facebook, 
  Copy, 
  Check,
  MessageCircle,
  Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

interface ShareAchievementProps {
  title: string;
  description: string;
  imageUrl?: string;
  shareUrl: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function ShareAchievement({
  title,
  description,
  imageUrl,
  shareUrl,
  variant = "outline",
  size = "sm",
  className = ""
}: ShareAchievementProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // Prepare share text
  const shareText = `${title} - ${description}`;
  
  // Prepare share URLs
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard.",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => window.open(twitterUrl, "_blank")}
        >
          <Twitter className="h-4 w-4 mr-2 text-blue-400" />
          Share on Twitter
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => window.open(facebookUrl, "_blank")}
        >
          <Facebook className="h-4 w-4 mr-2 text-blue-600" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => window.open(whatsappUrl, "_blank")}
        >
          <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
          Share on WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={handleCopyLink}
        >
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <LinkIcon className="h-4 w-4 mr-2" />
          )}
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

