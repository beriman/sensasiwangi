import React from "react";
import ForumLayout from "../forum/ForumLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";

export default function ForumDemo() {
  return (
    <ForumLayout
      title="Forum Komunitas Perfumer"
      subtitle="Diskusikan dan bagikan pengalaman Anda tentang parfum"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              Diskusi Perfumer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              Bergabunglah dalam diskusi dengan komunitas perfumer
            </div>
          </CardContent>
        </Card>

        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-pink-500" />
              Review Parfum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              Bagikan ulasan dan pengalaman Anda dengan berbagai parfum
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Thread Terbaru
        </h2>
        <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Rekomendasi parfum dengan aroma kayu-kayuan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="line-clamp-2 text-gray-600 mb-4">
              Halo semua, saya sedang mencari parfum dengan aroma kayu-kayuan
              yang tahan lama. Apakah ada rekomendasi dari teman-teman?
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alice"
                    alt="User"
                  />
                  <AvatarFallback>AL</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Alice Perfumer
                  </p>
                  <p className="text-xs text-gray-500">120 EXP</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">5</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                    <span className="ml-1 text-sm text-gray-700">12</span>
                  </div>
                  <div className="flex items-center">
                    <ThumbsDown className="h-4 w-4 text-red-500" />
                    <span className="ml-1 text-sm text-gray-700">2</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Review: Dior Sauvage EDP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="line-clamp-2 text-gray-600 mb-4">
              Baru saja membeli Dior Sauvage EDP dan ingin berbagi pengalaman
              saya. Parfum ini memiliki aroma yang sangat maskulin dengan notes
              utama bergamot dan ambroxan...
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bob"
                    alt="User"
                  />
                  <AvatarFallback>BO</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Bob Johnson
                  </p>
                  <p className="text-xs text-gray-500">85 EXP</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">8</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                    <span className="ml-1 text-sm text-gray-700">20</span>
                  </div>
                  <div className="flex items-center">
                    <ThumbsDown className="h-4 w-4 text-red-500" />
                    <span className="ml-1 text-sm text-gray-700">1</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ForumLayout>
  );
}
