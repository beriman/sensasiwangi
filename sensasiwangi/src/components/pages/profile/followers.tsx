import React from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import FollowersList from "@/components/profile/FollowersList";

export default function FollowersPage() {
  const { userId } = useParams<{ userId: string }>();

  if (!userId) {
    return <div>User ID is required</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Link to={`/profile/${userId}`}>
          <Button variant="outline" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </Button>
        </Link>
      </div>

      <FollowersList userId={userId} limit={100} />
    </div>
  );
}
