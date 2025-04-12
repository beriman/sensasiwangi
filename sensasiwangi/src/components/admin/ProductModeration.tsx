// @ts-ignore
import React, { useEffect, useState } from "react";
// @ts-ignore
import { supabase } from "../../../supabase/supabase";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
// @ts-ignore
import { Button } from "../ui/button";
// @ts-ignore
import { Badge } from "../ui/badge";
// @ts-ignore
import { useToast } from "../ui/use-toast";
// @ts-ignore
import { MarketplaceProduct } from "../../types/marketplace";
// @ts-ignore
import { Check, X, AlertTriangle, Eye } from "lucide-react";

const ProductModeration = () => {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const fetchPendingProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("marketplace_products")
        .select(
          `
          *,
          seller:seller_id(full_name, avatar_url)
        `,
        )
        .eq("moderation_status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching pending products:", error);
      toast({
        variant: "destructive",
        title: "Error fetching products",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from("marketplace_products")
        .update({ moderation_status: "approved", status: "active" })
        .eq("id", productId);

      if (error) throw error;

      // Update local state
      setProducts(products.filter((product) => product.id !== productId));

      toast({
        title: "Product approved",
        description: "The product has been approved and is now active.",
      });
    } catch (error) {
      console.error("Error approving product:", error);
      toast({
        variant: "destructive",
        title: "Error approving product",
        description: "Please try again later.",
      });
    }
  };

  const rejectProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from("marketplace_products")
        .update({ moderation_status: "rejected", status: "inactive" })
        .eq("id", productId);

      if (error) throw error;

      // Update local state
      setProducts(products.filter((product) => product.id !== productId));

      toast({
        title: "Product rejected",
        description: "The product has been rejected.",
      });
    } catch (error) {
      console.error("Error rejecting product:", error);
      toast({
        variant: "destructive",
        title: "Error rejecting product",
        description: "Please try again later.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center justify-between">
          <span>Product Moderation</span>
          <Button
            onClick={fetchPendingProducts}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Seller</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Sambatan</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded object-cover"
                          src={
                            product.image_url ||
                            "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&q=80"
                          }
                          alt=""
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {product.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <img
                          className="h-8 w-8 rounded-full"
                          src={
                            product.seller?.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${product.seller_id}`
                          }
                          alt=""
                        />
                      </div>
                      <div className="ml-2 text-sm text-gray-900">
                        {product.seller?.full_name || "Unknown Seller"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Rp {product.price.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.is_sambatan ? (
                      <Badge className="bg-blue-500 hover:bg-blue-600">
                        Sambatan
                      </Badge>
                    ) : (
                      <Badge variant="outline">Regular</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(product.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => approveProduct(product.id)}
                        variant="outline"
                        size="sm"
                        className="text-xs bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                      >
                        <Check className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button
                        onClick={() => rejectProduct(product.id)}
                        variant="outline"
                        size="sm"
                        className="text-xs bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                      >
                        <X className="h-3 w-3 mr-1" /> Reject
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          window.open(
                            `/marketplace/product/${product.id}`,
                            "_blank",
                          )
                        }
                      >
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No pending products found
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Loading products...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductModeration;



