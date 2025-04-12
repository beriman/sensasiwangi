// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import { supabase } from "../../../../supabase/supabase";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
// @ts-ignore
import { Button } from "../../../components/ui/button";
// @ts-ignore
import { LoadingSpinner } from "../../../components/ui/loading-spinner";
// @ts-ignore
import { formatDistanceToNow } from "date-fns";
// @ts-ignore
import { Store, Edit, Trash2, Plus, ShoppingBag } from "lucide-react";
// @ts-ignore
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  title: string;
  price: number;
  created_at: string;
  status: string;
  image_url: string;
}

interface UserLapakActivityProps {
  userId: string;
}

export default function UserLapakActivity({ userId }: UserLapakActivityProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLapakActivity = async () => {
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
        console.error("Error fetching lapak activity:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLapakActivity();
  }, [userId]);

  const handleEditProduct = (productId: string) => {
    navigate(`/marketplace/edit/${productId}`);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const { error } = await supabase
          .from("marketplace_products")
          .delete()
          .eq("id", productId);

        if (error) throw error;

        // Update the local state
        setProducts(products.filter((product) => product.id !== productId));
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const handleAddProduct = () => {
    navigate("/marketplace/new");
  };

  if (loading) {
    return <LoadingSpinner text="Loading your shop..." />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium flex items-center">
          <Store className="h-5 w-5 mr-2" />
          My Shop ({products.length} products)
        </CardTitle>
        <Button
          onClick={handleAddProduct}
          size="sm"
          className="flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Product
        </Button>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 mb-4">
              You haven't listed any products yet
            </p>
            <Button
              onClick={handleAddProduct}
              className="flex items-center mx-auto"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Your First Product
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Product
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Price
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">
                    Listed
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded bg-gray-100 mr-3 overflow-hidden flex-shrink-0">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <ShoppingBag className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <a
                          href={`/marketplace/product/${product.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800 truncate max-w-xs"
                        >
                          {product.title}
                        </a>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${getStatusBadgeColor(
                          product.status,
                        )}`}
                      >
                        {formatStatus(product.status)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-500 text-sm">
                      {formatDistanceToNow(new Date(product.created_at))} ago
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditProduct(product.id)}
                          title="Edit product"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteProduct(product.id)}
                          title="Delete product"
                          className="text-red-500 hover:text-red-700 hover:border-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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


