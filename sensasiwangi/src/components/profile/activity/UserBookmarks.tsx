// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import { supabase } from "../../../../supabase/supabase";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
// @ts-ignore
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
// @ts-ignore
import { LoadingSpinner } from "../../../components/ui/loading-spinner";
// @ts-ignore
import { formatDistanceToNow } from "date-fns";
// @ts-ignore
import { Bookmark, MessageSquare, ShoppingBag } from "lucide-react";

interface BookmarkedThread {
  id: string;
  thread: {
    id: string;
    title: string;
    created_at: string;
    author: { username: string };
    category: { name: string };
  };
  created_at: string;
}

interface BookmarkedProduct {
  id: string;
  product: {
    id: string;
    title: string;
    price: number;
    image_url: string;
    seller: { username: string };
  };
  created_at: string;
}

interface UserBookmarksProps {
  userId: string;
  isOwnProfile: boolean;
}

export default function UserBookmarks({
  userId,
  isOwnProfile,
}: UserBookmarksProps) {
  const [threadBookmarks, setThreadBookmarks] = useState<BookmarkedThread[]>(
    [],
  );
  const [productBookmarks, setProductBookmarks] = useState<BookmarkedProduct[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("threads");

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        setLoading(true);

        // Only fetch bookmarks if it's the user's own profile
        if (!isOwnProfile) {
          setLoading(false);
          return;
        }

        // Fetch thread bookmarks
        const { data: threadData, error: threadError } = await supabase
          .from("forum_bookmarks")
          .select(
            "id, created_at, thread:thread_id(id, title, created_at, author:author_id(username), category:category_id(name))",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (threadError) throw threadError;
        setThreadBookmarks(threadData || []);

        // Fetch product bookmarks
        const { data: productData, error: productError } = await supabase
          .from("marketplace_bookmarks")
          .select(
            "id, created_at, product:product_id(id, title, price, image_url, seller:seller_id(username))",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (productError) throw productError;
        setProductBookmarks(productData || []);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [userId, isOwnProfile]);

  if (loading) {
    return <LoadingSpinner text="Loading bookmarks..." />;
  }

  // If not own profile, show privacy message
  if (!isOwnProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center">
            <Bookmark className="h-5 w-5 mr-2" />
            Bookmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Bookmark className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">Bookmarks are private to the user</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center">
          <Bookmark className="h-5 w-5 mr-2" />
          Bookmarks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="threads">
              <MessageSquare className="h-4 w-4 mr-2" />
              Threads ({threadBookmarks.length})
            </TabsTrigger>
            <TabsTrigger value="products">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Products ({productBookmarks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="threads" className="mt-4">
            {threadBookmarks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No bookmarked threads
              </p>
            ) : (
              <div className="space-y-3">
                {threadBookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="border rounded-md p-3 hover:bg-gray-50"
                  >
                    <a
                      href={`/forum/thread/${bookmark.thread?.id}`}
                      className="block"
                    >
                      <h3 className="font-medium text-blue-600 hover:text-blue-800">
                        {bookmark.thread?.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <span>By {bookmark.thread?.author?.username}</span>
                        <span className="mx-2">•</span>
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                          {bookmark.thread?.category?.name || "Uncategorized"}
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          Bookmarked{" "}
                          {formatDistanceToNow(new Date(bookmark.created_at))}{" "}
                          ago
                        </span>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="mt-4">
            {productBookmarks.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No bookmarked products
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productBookmarks.map((bookmark) => (
                  <a
                    key={bookmark.id}
                    href={`/marketplace/product/${bookmark.product?.id}`}
                    className="block group"
                  >
                    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        {bookmark.product?.image_url ? (
                          <img
                            src={bookmark.product.image_url}
                            alt={bookmark.product.title}
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
                          {bookmark.product?.title}
                        </h3>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-lg font-semibold text-green-600">
                            ${bookmark.product?.price.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500">
                            By {bookmark.product?.seller?.username}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Bookmarked{" "}
                          {formatDistanceToNow(new Date(bookmark.created_at))}{" "}
                          ago
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


