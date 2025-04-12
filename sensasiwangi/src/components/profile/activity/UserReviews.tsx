// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import { supabase } from "../../../../supabase/supabase";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
// @ts-ignore
import { LoadingSpinner } from "../../../components/ui/loading-spinner";
// @ts-ignore
import { formatDistanceToNow } from "date-fns";
// @ts-ignore
import { Star, StarHalf } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  product: {
    id: string;
    title: string;
    image_url: string;
    seller: { username: string };
  };
}

interface UserReviewsProps {
  userId: string;
}

export default function UserReviews({ userId }: UserReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);

        // Fetch user's reviews
        const { data, error } = await supabase
          .from("marketplace_reviews")
          .select(
            "id, rating, comment, created_at, product:product_id(id, title, image_url, seller:seller_id(username))",
          )
          .eq("reviewer_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setReviews(data || []);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [userId]);

  if (loading) {
    return <LoadingSpinner text="Loading reviews..." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center">
          <Star className="h-5 w-5 mr-2 fill-yellow-400 text-yellow-400" />
          Product Reviews ({reviews.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No reviews written yet
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-start">
                  <div className="h-16 w-16 rounded bg-gray-100 mr-4 overflow-hidden flex-shrink-0">
                    {review.product?.image_url ? (
                      <img
                        src={review.product.image_url}
                        alt={review.product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-200">
                        <Star className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <a
                        href={`/marketplace/product/${review.product?.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {review.product?.title}
                      </a>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(review.created_at))} ago
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Seller: {review.product?.seller?.username}
                    </div>
                    <div className="flex items-center mt-2">
                      {renderStarRating(review.rating)}
                      <span className="ml-2 font-medium">
                        {review.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-700">{review.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function renderStarRating(rating: number) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Star
        key={`full-${i}`}
        className="h-4 w-4 fill-yellow-400 text-yellow-400"
      />,
    );
  }

  // Add half star if needed
  if (hasHalfStar) {
    stars.push(
      <StarHalf
        key="half"
        className="h-4 w-4 fill-yellow-400 text-yellow-400"
      />,
    );
  }

  // Add empty stars
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
  }

  return <div className="flex">{stars}</div>;
}


