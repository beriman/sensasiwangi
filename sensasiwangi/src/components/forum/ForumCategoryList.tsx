import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MessageSquare, Users, Clock, ArrowUpRight } from "lucide-react";

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  thread_count: number;
  last_activity: string | null;
  last_thread_id: string | null;
  last_thread_title: string | null;
  last_user_id: string | null;
  last_user_name: string | null;
  last_user_avatar: string | null;
}

export default function ForumCategoryList() {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from("forum_categories")
          .select(`
            id,
            name,
            description,
            icon,
            color,
            thread_count,
            last_activity,
            last_thread_id,
            last_thread_title,
            last_user_id,
            last_user_name,
            last_user_avatar
          `)
          .order("order", { ascending: true });
        
        if (error) throw error;
        
        setCategories(data || []);
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
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No categories found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <Card key={category.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <Link to={`/forum/category/${category.id}`} className="block">
              <div className="flex items-start p-6">
                <div className="flex-shrink-0 mr-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${category.color || 'bg-purple-100'}`}>
                    <span className="text-xl">{category.icon || '💬'}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {category.description}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    <span className="mr-4">{category.thread_count} threads</span>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <Button variant="ghost" size="sm" className="rounded-full">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
              
              {category.last_thread_id && (
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-500 mr-2">Latest:</span>
                    <Link 
                      to={`/forum/thread/${category.last_thread_id}`}
                      className="font-medium text-purple-600 hover:text-purple-700 truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {category.last_thread_title}
                    </Link>
                    {category.last_user_name && (
                      <>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-500">by {category.last_user_name}</span>
                      </>
                    )}
                    {category.last_activity && (
                      <>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-500">
                          {new Date(category.last_activity).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
