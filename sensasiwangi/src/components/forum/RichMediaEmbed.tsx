// @ts-ignore
import React from "react";

interface RichMediaEmbedProps {
  url: string;
  className?: string;
}

export default function RichMediaEmbed({
  url,
  className = "",
}: RichMediaEmbedProps) {
  // Function to extract YouTube video ID
  const getYoutubeId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Function to extract Vimeo video ID
  const getVimeoId = (url: string) => {
    const regExp =
      /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|)(\d+)(?:|\/\?)/;
    const match = url.match(regExp);
    return match ? match[2] : null;
  };

  // Function to extract TikTok video ID
  const getTikTokId = (url: string) => {
    const regExp = /tiktok\.com\/@[^\/]+\/video\/(\d+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Check if URL is an image
  const isImage = (url: string) => {
    return /\.(jpeg|jpg|gif|png)$/i.test(url);
  };

  // Render appropriate embed based on URL
  if (isImage(url)) {
    return (
      <div className={`overflow-hidden rounded-lg ${className}`}>
        <img src={url} alt="Embedded content" className="max-w-full h-auto" />
      </div>
    );
  }

  const youtubeId = getYoutubeId(url);
  if (youtubeId) {
    return (
      <div className={`aspect-video ${className}`}>
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
        ></iframe>
      </div>
    );
  }

  const vimeoId = getVimeoId(url);
  if (vimeoId) {
    return (
      <div className={`aspect-video ${className}`}>
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}`}
          title="Vimeo video player"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
        ></iframe>
      </div>
    );
  }

  const tiktokId = getTikTokId(url);
  if (tiktokId || url.includes("tiktok.com")) {
    return (
      <div className={`${className}`}>
        <blockquote
          className="tiktok-embed rounded-lg overflow-hidden"
          cite={url}
          data-video-id={tiktokId}
        >
          <section>
            <a href={url} target="_blank" rel="noreferrer">
              {url}
            </a>
          </section>
        </blockquote>
        {/* TikTok embed script */}
        <script async src="https://www.tiktok.com/embed.js"></script>
      </div>
    );
  }

  // Fallback for unsupported URLs
  return (
    <div className={`p-4 border border-gray-200 rounded-lg ${className}`}>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-blue-600 hover:underline break-all"
      >
        {url}
      </a>
    </div>
  );
}

