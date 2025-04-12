// @ts-ignore
import React, { useEffect, useState } from "react";
// @ts-ignore
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
// @ts-ignore
import { MessageSquare, Users } from "lucide-react";
// @ts-ignore
import { getForumCategories } from "../../lib/forum";
// @ts-ignore
import { ForumCategory } from "../../types/forum";
// @ts-ignore
import { LoadingSpinner } from "../../components/ui/loading-spinner";

export default function ForumCategories() {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getForumCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Memuat kategori forum..." />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {categories.map((category) => (
        <Link key={category.id} to={`/forum/category/${category.id}`}>
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {category.name === "Diskusi Perfumer" ? (
                  <Users className="h-5 w-5 text-purple-500" />
                ) : (
                  <MessageSquare className="h-5 w-5 text-pink-500" />
                )}
                {category.name}
              </CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">
                Bergabunglah dalam diskusi dengan komunitas perfumer
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}


