// @ts-ignore
import React from "react";
// @ts-ignore
import DOMPurify from "dompurify";
// @ts-ignore
import ProductShareCard from "./ProductShareCard";
// @ts-ignore
import { MarketplaceProduct } from "../../types/marketplace";
// @ts-ignore
import { MapPin } from "lucide-react";
// @ts-ignore
import { Button } from "../../components/ui/button";

interface MessageRendererProps {
  content: string;
}

export default function MessageRenderer({ content }: MessageRendererProps) {
  // Check if the message contains a product share or location share
  const hasProductShare = content.includes("data-product-share");
  const hasLocationShare = content.includes("data-location-share");

  if (!hasProductShare && !hasLocationShare) {
    // Regular message, just sanitize and render
    return (
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
      />
    );
  }

  try {
    // Extract product data from the message
    const productShareMatch = content.match(/<div data-product-share='(.+?)'><\/div>/);

    // Extract location data from the message
    const locationShareMatch = content.match(/<div data-location-share='(.+?)'><\/div>/);

    if (productShareMatch && productShareMatch[1]) {
      // Parse the product data
      const productData = JSON.parse(productShareMatch[1]);

      // Remove the product share data from the content
      const cleanContent = content.replace(/<div data-product-share='(.+?)'><\/div>/, "");

      // Create a product object from the data
      const product: MarketplaceProduct = {
        id: productData.product.id,
        name: productData.product.name,
        price: productData.product.price,
        image_url: productData.product.image_url,
        seller_id: "", // Required by type but not needed for display
        description: null,
        status: "active",
        created_at: "",
        updated_at: "",
      };

      return (
        <div className="space-y-2">
          <ProductShareCard product={product} />
          {cleanContent && cleanContent !== "<p></p>" && (
            <div
              className="prose prose-sm max-w-none mt-2"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cleanContent) }}
            />
          )}
        </div>
      );
    } else if (locationShareMatch && locationShareMatch[1]) {
      // Parse the location data
      const locationData = JSON.parse(locationShareMatch[1]);

      // Remove the location share data from the content
      const cleanContent = content.replace(/<div data-location-share='(.+?)'><\/div>/, "");

      // Get location details
      const { lat, lng, address } = locationData.location;

      // Create a Google Maps URL
      const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

      return (
        <div className="space-y-2">
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium">Lokasi Dibagikan</p>
                <p className="text-xs text-gray-600 break-words mb-2">{address}</p>
                <div className="aspect-video w-full rounded-md overflow-hidden border mb-2">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`}
                    allowFullScreen
                  ></iframe>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => window.open(mapsUrl, "_blank")}
                >
                  Buka di Google Maps
                </Button>
              </div>
            </div>
          </div>
          {cleanContent && cleanContent !== "<p></p>" && (
            <div
              className="prose prose-sm max-w-none mt-2"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cleanContent) }}
            />
          )}
        </div>
      );
    } else {
      // If no match found, render as regular message
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />
      );
    }
  } catch (error) {
    console.error("Error rendering message with special content:", error);
    // Fallback to regular message rendering
    return (
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
      />
    );
  }
}


