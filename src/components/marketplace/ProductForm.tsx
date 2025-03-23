import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { getProduct, createProduct, updateProduct } from "@/lib/marketplace";
import { MarketplaceProduct } from "@/types/marketplace";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "../../../supabase/supabase";

interface ProductFormProps {
  mode: "create" | "edit";
}

export default function ProductForm({ mode }: ProductFormProps) {
  const { productId } = useParams<{ productId: string }>();
  const [loading, setLoading] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk mengakses fitur ini.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // Fetch product data if in edit mode
    if (mode === "edit" && productId) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const data = await getProduct(productId);

          if (!data) {
            toast({
              title: "Produk tidak ditemukan",
              description: "Produk yang Anda cari tidak ditemukan.",
              variant: "destructive",
            });
            navigate("/marketplace/my-shop");
            return;
          }

          // Check if user is the owner of the product
          if (data.seller_id !== user.id) {
            toast({
              title: "Akses ditolak",
              description:
                "Anda tidak memiliki akses untuk mengedit produk ini.",
              variant: "destructive",
            });
            navigate("/marketplace/my-shop");
            return;
          }

          setName(data.name);
          setDescription(data.description || "");
          setPrice(data.price.toString());
          setImageUrl(data.image_url);
          if (data.image_url) {
            setImagePreview(data.image_url);
          }
        } catch (error) {
          console.error("Error fetching product:", error);
          toast({
            title: "Error",
            description: "Gagal memuat data produk. Silakan coba lagi.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      fetchProduct();
    }
  }, [mode, productId, user, toast, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File terlalu besar",
        description: "Ukuran gambar maksimal 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Format file tidak didukung",
        description: "Silakan pilih file gambar (JPG, PNG, GIF).",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return imageUrl; // Return existing URL if no new file

    try {
      setUploadingImage(true);
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `marketplace/${user!.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("product-images")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Gagal mengunggah gambar. Silakan coba lagi.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk melanjutkan.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // Validate form
    if (!name.trim()) {
      toast({
        title: "Nama Produk Kosong",
        description: "Silakan masukkan nama produk.",
        variant: "destructive",
      });
      return;
    }

    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      toast({
        title: "Harga Tidak Valid",
        description: "Silakan masukkan harga yang valid.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Upload image if there's a new one
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadImage();
      }

      if (mode === "create") {
        // Create new product
        await createProduct(
          user.id,
          name,
          description,
          Number(price),
          finalImageUrl || undefined,
        );

        toast({
          title: "Berhasil",
          description: "Produk berhasil ditambahkan.",
        });
      } else if (mode === "edit" && productId) {
        // Update existing product
        await updateProduct(productId, {
          name,
          description,
          price: Number(price),
          image_url: finalImageUrl,
        });

        toast({
          title: "Berhasil",
          description: "Produk berhasil diperbarui.",
        });
      }

      // Redirect to my shop
      navigate("/marketplace/my-shop");
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: `Gagal ${mode === "create" ? "menambahkan" : "memperbarui"} produk. Silakan coba lagi.`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Memuat data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Button
          variant="link"
          className="flex items-center text-purple-600 hover:underline p-0"
          onClick={() => navigate("/marketplace/my-shop")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali ke Lapak Saya
        </Button>
      </div>

      <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">
            {mode === "create" ? "Tambah Produk Baru" : "Edit Produk"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Nama Produk*
              </Label>
              <Input
                id="name"
                placeholder="Masukkan nama produk"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                Deskripsi
              </Label>
              <Textarea
                id="description"
                placeholder="Deskripsi produk (opsional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                className="min-h-[120px] w-full"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="price"
                className="text-sm font-medium text-gray-700"
              >
                Harga (Rp)*
              </Label>
              <Input
                id="price"
                type="number"
                placeholder="Masukkan harga"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={submitting}
                className="w-full"
                min="0"
                step="1000"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="image"
                className="text-sm font-medium text-gray-700"
              >
                Gambar Produk
              </Label>
              <div className="mt-1 flex items-center">
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Pilih Gambar
                </label>
                <input
                  id="image-upload"
                  name="image-upload"
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={submitting}
                />
                <span className="ml-3 text-sm text-gray-500">
                  {imageFile ? imageFile.name : "Belum ada file dipilih"}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Format: JPG, PNG, GIF. Ukuran maksimal: 5MB
              </p>

              {imagePreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Preview:
                  </p>
                  <div className="relative w-40 h-40 overflow-hidden rounded-md border border-gray-200">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        if (mode === "edit") {
                          setImageUrl(null);
                        }
                      }}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90"
                disabled={submitting || uploadingImage}
              >
                {(submitting || uploadingImage) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {submitting || uploadingImage
                  ? mode === "create"
                    ? "Menambahkan..."
                    : "Memperbarui..."
                  : mode === "create"
                    ? "Tambah Produk"
                    : "Perbarui Produk"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
