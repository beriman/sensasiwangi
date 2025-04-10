import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserForumActivity from "./activity/UserForumActivity";
import UserMarketplaceActivity from "./activity/UserMarketplaceActivity";
import UserLapakActivity from "./activity/UserLapakActivity";
import UserBookmarks from "./activity/UserBookmarks";
import UserHistory from "./activity/UserHistory";
import UserReviews from "./activity/UserReviews";
import UserSambatanHistory from "./activity/UserSambatanHistory";

interface UserActivityTabsProps {
  userId: string;
  isOwnProfile: boolean;
}

export default function UserActivityTabs({
  userId,
  isOwnProfile,
}: UserActivityTabsProps) {
  const [activeTab, setActiveTab] = useState("forum");

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-7 w-full mb-4">
          <TabsTrigger value="forum">Forum</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          {isOwnProfile && <TabsTrigger value="lapak">My Shop</TabsTrigger>}
          <TabsTrigger value="sambatan">Sambatan</TabsTrigger>
          <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
          {isOwnProfile && <TabsTrigger value="history">History</TabsTrigger>}
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="forum" className="mt-2">
          <UserForumActivity userId={userId} />
        </TabsContent>

        <TabsContent value="marketplace" className="mt-2">
          <UserMarketplaceActivity userId={userId} />
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="lapak" className="mt-2">
            <UserLapakActivity userId={userId} />
          </TabsContent>
        )}

        <TabsContent value="sambatan" className="mt-2">
          <UserSambatanHistory userId={userId} isOwnProfile={isOwnProfile} />
        </TabsContent>

        <TabsContent value="bookmarks" className="mt-2">
          <UserBookmarks userId={userId} isOwnProfile={isOwnProfile} />
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="history" className="mt-2">
            <UserHistory userId={userId} />
          </TabsContent>
        )}

        <TabsContent value="reviews" className="mt-2">
          <UserReviews userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
