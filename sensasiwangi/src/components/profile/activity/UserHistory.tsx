import React, { useState, useEffect } from "react";
import { supabase } from "../../../../supabase/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatDistanceToNow } from "date-fns";
import { History, MessageSquare, ShoppingBag } from "lucide-react";

interface ThreadHistory {
  id: string;
  thread: {
    id: string;
    title: string;
    category: { name: string };
  };
  last_viewed: string;
  view_count: number;
}

interface ProductHistory {
  id: string;
  product: {
    id: string;
    title: string;
    price: number;
    image_url: string;
    seller: { username: string };
  };
  last_viewed: string;
  view_count: number;
}

interface UserHistoryProps {
  userId: string;
}

export default function UserHistory({ userId }: UserHistoryProps) {
  const [threadHistory, setThreadHistory] = useState<ThreadHistory[]>([]);
  const [productHistory, setProductHistory] = useState<ProductHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("threads");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);

        // Fetch thread viewing history
        const { data: threadData, error: threadError } = await supabase
          .from("forum_reading_history")
          .select(
            "id, last_viewed, view_count, thread:thread_id(id, title, category:category_id(name))",
          )
          .eq("user_id", userId)
          .order("last_viewed", { ascending: false });

        if (threadError) throw threadError;
        setThreadHistory(threadData || []);

        // Fetch product viewing history
        const { data: productData, error: productError } = await supabase
          .from("marketplace_viewing_history")
          .select(
            "id, last_viewed, view_count, product:product_id(id, title, price, image_url, seller:seller_id(username))",
          )
          .eq("user_id", userId)
          .order("last_viewed", { ascending: false });

        if (productError) throw productError;
        setProductHistory(productData || []);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  if (loading) {
    return <LoadingSpinner text="Loading browsing history..." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center">
          <History className="h-5 w-5 mr-2" />
          Browsing History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="threads">
              <MessageSquare className="h-4 w-4 mr-2" />
              Threads ({threadHistory.length})
            </TabsTrigger>
            <TabsTrigger value="products">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Products ({productHistory.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="threads" className="mt-4">
            {threadHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No thread viewing history
              </p>
            ) : (
              <div className="space-y-3">
                {threadHistory.map((history) => (
                  <div
                    key={history.id}
                    className="border rounded-md p-3 hover:bg-gray-50"
                  >
                    <a
                      href={`/forum/thread/${history.thread?.id}`}
                      className="block"
                    >
                      <h3 className="font-medium text-blue-600 hover:text-blue-800">
                        {history.thread?.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs mr-2">
                          {history.thread?.category?.name || "Uncategorized"}
                        </span>
                        <span>
                          Last viewed{" "}
                          {formatDistanceToNow(new Date(history.last_viewed))}{" "}
                          ago
                        </span>
                        <span className="mx-2">•</span>
                        <span>Viewed {history.view_count} times</span>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="mt-4">
            {productHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No product viewing history
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productHistory.map((history) => (
                  <a
                    key={history.id}
                    href={`/marketplace/product/${history.product?.id}`}
                    className="block group"
                  >
                    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        {history.product?.image_url ? (
                          <img
                            src={history.product.image_url}
                            alt={history.product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <ShoppingBag className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-600 truncate">
                          {history.product?.title}
                        </h3>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-lg font-semibold text-green-600">
                            ${history.product?.price.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500">
                            By {history.product?.seller?.username}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>
                            Last viewed{" "}
                            {formatDistanceToNow(new Date(history.last_viewed))}{" "}
                            ago
                          </span>
                          <span>Viewed {history.view_count} times</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
