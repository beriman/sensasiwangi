import React, { useState, useEffect } from "react";
import { supabase } from "../../../../supabase/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDistanceToNow } from "date-fns";
import { ShoppingBag } from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  created_at: string;
  status: string;
  image_url: string;
}

interface UserMarketplaceActivityProps {
  userId: string;
}

export default function UserMarketplaceActivity({
  userId,
}: UserMarketplaceActivityProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketplaceActivity = async () => {
      try {
        setLoading(true);

        // Fetch user's products
        const { data, error } = await supabase
          .from("marketplace_products")
          .select("id, title, price, created_at, status, image_url")
          .eq("seller_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error("Error fetching marketplace activity:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketplaceActivity();
  }, [userId]);

  if (loading) {
    return <LoadingSpinner text="Loading marketplace activity..." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center">
          <ShoppingBag className="h-5 w-5 mr-2" />
          Products Listed ({products.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No products listed yet
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <a
                key={product.id}
                href={`/marketplace/product/${product.id}`}
                className="block group"
              >
                <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <ShoppingBag className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadgeColor(
                          product.status,
                        )}`}
                      >
                        {formatStatus(product.status)}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 truncate">
                      {product.title}
                    </h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-lg font-semibold text-green-600">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(product.created_at))} ago
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: "Active",
    sold: "Sold",
    pending: "Pending",
    draft: "Draft",
  };
  return statusMap[status] || status;
}

function getStatusBadgeColor(status: string): string {
  const colorMap: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    sold: "bg-blue-100 text-blue-800",
    pending: "bg-yellow-100 text-yellow-800",
    draft: "bg-gray-100 text-gray-800",
  };
  return colorMap[status] || "bg-gray-100 text-gray-800";
}
