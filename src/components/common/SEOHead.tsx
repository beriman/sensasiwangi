import React from "react";
import { Helmet } from "react-helmet";

interface SEOHeadProps {
  title: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogUrl?: string;
  ogType?: "website" | "article" | "product";
  twitterCard?: "summary" | "summary_large_image";
}

export default function SEOHead({
  title,
  description = "Komunitas dan marketplace untuk penggemar parfum di Indonesia. Temukan, diskusikan, dan beli parfum serta bahan parfum berkualitas.",
  keywords = ["parfum", "sensasiwangi", "komunitas parfum", "marketplace parfum", "bahan parfum", "perfume", "indonesia"],
  ogImage = "https://sensasiwangi.id/og-image.jpg",
  ogUrl = "https://sensasiwangi.id",
  ogType = "website",
  twitterCard = "summary_large_image",
}: SEOHeadProps) {
  const fullTitle = `${title} | Sensasiwangi.id`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(", ")} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter */}
      <meta property="twitter:card" content={twitterCard} />
      <meta property="twitter:url" content={ogUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={ogUrl} />
    </Helmet>
  );
}
