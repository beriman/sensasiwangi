import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ShoppingBag,
  User,
  Calendar,
  Users,
  Star,
  Heart,
  Share2,
  MapPin,
  Truck,
  Shield,
  Edit,
  Trash,
} from "lucide-react";
import {
  addToWishlist,
  removeFromWishlist,
  isProductWishlisted,
  getProductReviews,
  submitProductReview,
  hasUserReviewedProduct,
  deleteProductReview,
  getProductRating,
} from "@/lib/marketplace";
import { getProduct } from "@/lib/marketplace";
import { MarketplaceProduct, ProductReview } from "@/types/marketplace";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import SambatanButton from "./SambatanButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  reviewText: z.string().max(500).optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isSambatan, setIsSambatan] = useState(false); // For demo purposes
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      reviewText: "",
    },
  });

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        const data = await getProduct(productId);

        // Get product rating
        if (data) {
          const ratingData = await getProductRating(productId);
          data.avg_rating = ratingData.avg_rating;
          data.review_count = ratingData.review_count;
        }

        setProduct(data);

        if (data) {
          setIsSambatan(data.is_sambatan || false);

          // Check if there's an active sambatan for this product
          if (data.is_sambatan) {
            const { getSambatanByProduct } = await import("@/lib/sambatan");
            const sambatanData = await getSambatanByProduct(productId);
            if (sambatanData) {
              // There's an active sambatan for this product
              setIsSambatan(true);
            }
          }

          // Check if product is wishlisted
          if (user) {
            const wishlisted = await isProductWishlisted(productId);
            setIsWishlisted(wishlisted);
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast({
          title: "Error",
          description: "Gagal memuat produk. Silakan coba lagi.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, toast, user]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!productId) return;

      try {
        setReviewsLoading(true);
        const reviewsData = await getProductReviews(productId);
        setReviews(reviewsData);

        // Check if user has already reviewed this product
        if (user) {
          const hasReviewed = await hasUserReviewedProduct(productId);
          setUserHasReviewed(hasReviewed);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [productId, user]);

  const handleWishlistToggle = async () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk menambahkan ke wishlist.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!product) return;

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
        toast({
          title: "Berhasil",
          description: "Produk dihapus dari wishlist.",
        });
      } else {
        await addToWishlist(product.id);
        toast({
          title: "Berhasil",
          description: "Produk ditambahkan ke wishlist.",
        });
      }
      setIsWishlisted(!isWishlisted);
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast({
        title: "Error",
        description: "Gagal mengubah status wishlist. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setWishlistLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk menambahkan ke keranjang.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    toast({
      title: "Berhasil",
      description: "Produk ditambahkan ke keranjang.",
    });
  };

  const handleBuyNow = () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk membeli produk.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    toast({
      title: "Fitur dalam pengembangan",
      description: "Fitur beli langsung sedang dalam pengembangan.",
    });
  };

  const handleContact = () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk menghubungi penjual.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    toast({
      title: "Fitur dalam pengembangan",
      description: "Fitur chat dengan penjual sedang dalam pengembangan.",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Memuat produk..." />
      </div>
    );
  }

  if (!product) {
    return (
      <Card className="p-6 text-center bg-white border border-gray-100 rounded-lg">
        <p className="text-gray-500">Produk tidak ditemukan.</p>
        <Link
          to="/marketplace"
          className="mt-4 inline-block text-purple-600 hover:underline"
        >
          Kembali ke Marketplace
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <Link
          to="/marketplace"
          className="flex items-center text-gray-600 hover:text-purple-600"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali ke Marketplace
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column - Product Images */}
        <div className="md:col-span-5">
          <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full object-contain"
                style={{ height: "400px" }}
              />
            ) : (
              <div className="flex h-96 w-full items-center justify-center bg-gray-100">
                <ShoppingBag className="h-24 w-24 text-gray-300" />
              </div>
            )}
          </div>
          <div className="mt-3 flex space-x-2 overflow-x-auto pb-2">
            {/* Thumbnail images would go here */}
            <div className="w-20 h-20 border border-purple-500 rounded-md overflow-hidden flex-shrink-0">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                  <ShoppingBag className="h-6 w-6 text-gray-300" />
                </div>
              )}
            </div>
            {/* Additional thumbnails would be added here */}
          </div>
        </div>

        {/* Right Column - Product Info */}
        <div className="md:col-span-7">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            {isSambatan && (
              <Badge className="mb-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600">
                <Users className="h-3 w-3 mr-1" />
                Sambatan
              </Badge>
            )}
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>

            <div className="flex items-center mb-4">
              <div className="flex items-center text-yellow-500">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span className="ml-1 text-sm">
                  {product.avg_rating ? product.avg_rating.toFixed(1) : "0.0"}
                </span>
              </div>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-sm text-gray-500">
                {product.review_count
                  ? `${product.review_count} ulasan`
                  : "Belum ada ulasan"}
              </span>
              <span className="mx-2 text-gray-300">|</span>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(product.created_at), {
                  addSuffix: true,
                  locale: id,
                })}
              </span>
            </div>

            <div className="mb-4">
              <p className="text-2xl font-bold text-red-600">
                {formatPrice(product.price)}
              </p>
            </div>

            <div className="border-t border-b border-gray-100 py-4 mb-4">
              <div className="flex items-start mb-3">
                <div className="w-24 text-sm text-gray-500">Pengiriman</div>
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm">
                      {product.seller?.city || "Jakarta Pusat"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Truck className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm">
                      Tersedia beberapa pilihan kurir
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-24 text-sm text-gray-500">Jumlah</div>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <span className="mx-3 text-sm">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                  <span className="ml-3 text-sm text-gray-500">Stok: 100</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Button
                variant="outline"
                className="flex-1 border-purple-500 text-purple-500 hover:bg-purple-50"
                onClick={handleAddToCart}
              >
                + Keranjang
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleBuyNow}
              >
                Beli Sekarang
              </Button>
              {isSambatan ? (
                <Button
                  variant="outline"
                  className="flex-1 border-pink-500 text-pink-500 hover:bg-pink-50"
                  onClick={handleContact}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Lihat Sambatan
                </Button>
              ) : (
                <SambatanButton productId={product.id} className="flex-1" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${isWishlisted ? "text-red-500" : "text-gray-500"}`}
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                >
                  <Heart
                    className={`h-4 w-4 mr-1 ${isWishlisted ? "fill-red-500" : ""}`}
                  />
                  {isWishlisted
                    ? "Dihapus dari Wishlist"
                    : "Tambah ke Wishlist"}
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-500">
                  <Share2 className="h-4 w-4 mr-1" />
                  Bagikan
                </Button>
              </div>

              <div className="flex items-center">
                <Shield className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs text-green-500">100% Original</span>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white rounded-lg border border-gray-100 overflow-hidden">
            <div className="flex items-center p-4 border-b border-gray-100">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage
                  src={
                    product.seller?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${product.seller_id}`
                  }
                  alt={product.seller?.full_name || "Seller"}
                />
                <AvatarFallback>
                  {product.seller?.full_name?.[0] || "S"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">
                  {product.seller?.full_name || "Seller"}
                </p>
                <div className="flex items-center">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  <span className="text-xs ml-1">4.9</span>
                  <span className="mx-1 text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">Online</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto border-purple-500 text-purple-500 hover:bg-purple-50"
                onClick={handleContact}
              >
                Kunjungi Toko
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-6 bg-white rounded-lg border border-gray-100 overflow-hidden">
        <Tabs defaultValue="description">
          <TabsList className="w-full border-b border-gray-100 rounded-none bg-white">
            <TabsTrigger value="description" className="flex-1">
              Deskripsi Produk
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1">
              Ulasan (25)
            </TabsTrigger>
            <TabsTrigger value="discussion" className="flex-1">
              Diskusi
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="p-4">
            <div className="prose max-w-none whitespace-pre-line">
              {product.description || "Tidak ada deskripsi produk."}
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="p-4">
            {user && !userHasReviewed && (
              <div className="mb-8 p-4 border border-gray-100 rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium mb-4">Berikan Ulasan</h3>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(async (values) => {
                      if (!productId) return;

                      try {
                        setSubmittingReview(true);
                        await submitProductReview(
                          productId,
                          selectedRating || values.rating,
                          values.reviewText,
                        );

                        toast({
                          title: "Berhasil",
                          description:
                            "Ulasan Anda telah dikirim. Terima kasih!",
                        });

                        // Refresh reviews
                        const reviewsData = await getProductReviews(productId);
                        setReviews(reviewsData);
                        setUserHasReviewed(true);

                        // Update product rating
                        if (product) {
                          const ratingData = await getProductRating(productId);
                          setProduct({
                            ...product,
                            avg_rating: ratingData.avg_rating,
                            review_count: ratingData.review_count,
                          });
                        }

                        form.reset();
                      } catch (error) {
                        console.error("Error submitting review:", error);
                        toast({
                          title: "Error",
                          description:
                            "Gagal mengirim ulasan. Silakan coba lagi.",
                          variant: "destructive",
                        });
                      } finally {
                        setSubmittingReview(false);
                      }
                    })}
                    className="space-y-4"
                  >
                    <div className="mb-4">
                      <FormLabel>Rating</FormLabel>
                      <div className="flex items-center mt-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setSelectedRating(rating)}
                            className="mr-1 focus:outline-none"
                          >
                            <Star
                              className={`h-6 w-6 ${selectedRating >= rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="reviewText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ulasan (Opsional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Bagikan pengalaman Anda dengan produk ini..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full md:w-auto bg-purple-600 hover:bg-purple-700"
                      disabled={submittingReview || selectedRating === 0}
                    >
                      {submittingReview ? "Mengirim..." : "Kirim Ulasan"}
                    </Button>
                  </form>
                </Form>
              </div>
            )}

            {reviewsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner text="Memuat ulasan..." />
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-6">
                <h3 className="text-lg font-medium mb-4">
                  Ulasan Produk ({reviews.length})
                </h3>
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-gray-100 pb-6 mb-6 last:border-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage
                            src={
                              review.user?.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user_id}`
                            }
                            alt={review.user?.full_name || ""}
                          />
                          <AvatarFallback>
                            {review.user?.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {review.user?.full_name || "Pengguna"}
                          </p>
                          <div className="flex items-center mt-1">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${star <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500 ml-2">
                              {formatDistanceToNow(
                                new Date(review.created_at),
                                {
                                  addSuffix: true,
                                  locale: id,
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {user && user.id === review.user_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={async () => {
                            if (
                              !window.confirm(
                                "Apakah Anda yakin ingin menghapus ulasan ini?",
                              )
                            )
                              return;

                            try {
                              await deleteProductReview(review.id);
                              toast({
                                title: "Berhasil",
                                description: "Ulasan Anda telah dihapus.",
                              });

                              // Refresh reviews
                              const reviewsData = await getProductReviews(
                                productId || "",
                              );
                              setReviews(reviewsData);
                              setUserHasReviewed(false);

                              // Update product rating
                              if (product && productId) {
                                const ratingData =
                                  await getProductRating(productId);
                                setProduct({
                                  ...product,
                                  avg_rating: ratingData.avg_rating,
                                  review_count: ratingData.review_count,
                                });
                              }
                            } catch (error) {
                              console.error("Error deleting review:", error);
                              toast({
                                title: "Error",
                                description:
                                  "Gagal menghapus ulasan. Silakan coba lagi.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Hapus
                        </Button>
                      )}
                    </div>

                    {review.review_text && (
                      <div className="mt-3 text-gray-700 pl-13 ml-13">
                        <p className="whitespace-pre-line">
                          {review.review_text}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Belum ada ulasan untuk produk ini.</p>
                {user && !userHasReviewed && (
                  <p className="mt-2">
                    Jadilah yang pertama memberikan ulasan!
                  </p>
                )}
              </div>
            )}
          </TabsContent>
          <TabsContent value="discussion" className="p-4">
            <div className="text-center py-8 text-gray-500">
              <p>Belum ada diskusi untuk produk ini.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Recommended Products */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Produk Serupa</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* This would be populated with actual similar products */}
          {Array(6)
            .fill(0)
            .map((_, index) => (
              <Card
                key={index}
                className="h-full overflow-hidden hover:shadow-md transition-all duration-200 bg-white border border-gray-100 rounded-lg"
              >
                <div className="aspect-square w-full overflow-hidden bg-gray-100">
                  <div className="flex h-full w-full items-center justify-center bg-gray-100">
                    <ShoppingBag className="h-8 w-8 text-gray-300" />
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="text-sm line-clamp-2 h-10 text-gray-700">
                    Produk Serupa {index + 1}
                  </h3>
                  <div className="mt-2">
                    <p className="font-bold text-base text-red-600">
                      {formatPrice(Math.floor(Math.random() * 500000) + 50000)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
