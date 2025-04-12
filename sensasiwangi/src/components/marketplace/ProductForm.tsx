// @ts-ignore
import React, { useEffect, useState } from "react";
// @ts-ignore
import { useParams, useNavigate } from "react-router-dom";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Input } from "../../components/ui/input";
// @ts-ignore
import { Label } from "../../components/ui/label";
// @ts-ignore
import { Textarea } from "../../components/ui/textarea";
// @ts-ignore
import { ArrowLeft, Upload, Loader2, Plus, X } from "lucide-react";
// @ts-ignore
import { getProduct, createProduct, updateProduct } from "../../lib/marketplace";
// @ts-ignore
import { MarketplaceProduct } from "../../types/marketplace";
// @ts-ignore
import { LoadingSpinner } from "../../components/ui/loading-spinner";
// @ts-ignore
import { useAuth } from "../../../supabase/auth";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";
// @ts-ignore
import { supabase } from "../../../supabase/supabase";
// @ts-ignore
import { Switch } from "../../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
// @ts-ignore
import { useEditor, EditorContent } from "@tiptap/react";
// @ts-ignore
import StarterKit from "@tiptap/starter-kit";
// @ts-ignore
import Image from "@tiptap/extension-image";
// @ts-ignore
import Link from "@tiptap/extension-link";
// @ts-ignore
import Typography from "@tiptap/extension-typography";
// @ts-ignore
import Placeholder from "@tiptap/extension-placeholder";

export default function ProductForm({ mode }: { mode: "create" | "edit" }) {
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
  const [additionalImages, setAdditionalImages] = useState<
    { file: File | null; preview: string; url?: string }[]
  >([]);
  const [category, setCategory] = useState("parfum");
  const [stock, setStock] = useState("100");
  const [weight, setWeight] = useState("100");
  const [condition, setCondition] = useState("new");
  const [enableSambatan, setEnableSambatan] = useState(false);
  const [minParticipants, setMinParticipants] = useState("2");
  const [maxParticipants, setMaxParticipants] = useState("10");

  // Rich text editor for product description
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link,
      Typography,
      Placeholder.configure({
        placeholder: "Tulis deskripsi produk yang detail di sini...",
      }),
    ],
    content: description,
    onUpdate: ({ editor }) => {
      setDescription(editor.getHTML());
    },
  });

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
          // Set default values for new fields
          setCategory(data.category || "parfum");
          setStock(data.stock?.toString() || "100");
          setWeight(data.weight?.toString() || "100");
          setCondition(data.condition || "new");
          setEnableSambatan(data.is_sambatan || false);
          setMinParticipants(data.min_participants?.toString() || "2");
          setMaxParticipants(data.max_participants?.toString() || "10");
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

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isMainImage = true,
  ) => {
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

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;

      if (isMainImage) {
        setImageFile(file);
        setImagePreview(preview);
      } else {
        setAdditionalImages([...additionalImages, { file, preview }]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAdditionalImage = (index: number) => {
    const newImages = [...additionalImages];
    newImages.splice(index, 1);
    setAdditionalImages(newImages);
  };

  const uploadImage = async (file?: File): Promise<string | null> => {
    if (!file && !imageFile) return imageUrl; // Return existing URL if no new file

    const fileToUpload = file || imageFile;
    if (!fileToUpload) return null;

    try {
      setUploadingImage(true);
      const fileExt = fileToUpload.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `marketplace/${user!.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("product-images")
        .upload(filePath, fileToUpload);

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
      if (!file) setUploadingImage(false); // Only set to false if it's the main image upload
    }
  };

  const uploadAllImages = async (): Promise<{
    mainImage: string | null;
    additionalImages: string[];
  }> => {
    try {
      setUploadingImage(true);

      // Upload main image
      const mainImageUrl = await uploadImage();

      // Upload additional images
      const additionalImageUrls: string[] = [];

      for (const img of additionalImages) {
        if (img.file) {
          const url = await uploadImage(img.file);
          if (url) additionalImageUrls.push(url);
        } else if (img.url) {
          additionalImageUrls.push(img.url);
        }
      }

      return {
        mainImage: mainImageUrl,
        additionalImages: additionalImageUrls,
      };
    } catch (error) {
      console.error("Error uploading images:", error);
      throw error;
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

      // Upload all images
      const {
        mainImage: finalImageUrl,
        additionalImages: additionalImageUrls,
      } = await uploadAllImages();

      // Prepare product data with new fields
      const productData = {
        name,
        description,
        price: Number(price),
        image_url: finalImageUrl,
        additional_images: additionalImageUrls,
        category,
        stock: Number(stock),
        weight: Number(weight),
        condition,
        is_sambatan: enableSambatan,
        min_participants: enableSambatan ? Number(minParticipants) : null,
        max_participants: enableSambatan ? Number(maxParticipants) : null,
      };

      if (mode === "create") {
        // Create new product
        await createProduct(
          user.id,
          name,
          description,
          Number(price),
          finalImageUrl || undefined,
          productData,
        );

        toast({
          title: "Berhasil",
          description: "Produk berhasil ditambahkan.",
        });
      } else if (mode === "edit" && productId) {
        // Update existing product
        await updateProduct(productId, productData);

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  htmlFor="category"
                  className="text-sm font-medium text-gray-700"
                >
                  Kategori*
                </Label>
                <Select
                  value={category}
                  onValueChange={setCategory}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parfum">Parfum Jadi</SelectItem>
                    <SelectItem value="bahan">Bahan Baku</SelectItem>
                    <SelectItem value="alat">Alat Perfumery</SelectItem>
                    <SelectItem value="finished_product">
                      Finished Product
                    </SelectItem>
                    <SelectItem value="raw_material">Raw Material</SelectItem>
                    <SelectItem value="fine_parfume">Fine Parfume</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="stock"
                  className="text-sm font-medium text-gray-700"
                >
                  Stok*
                </Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="Jumlah stok"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  disabled={submitting}
                  className="w-full"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="weight"
                  className="text-sm font-medium text-gray-700"
                >
                  Berat (gram)*
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="Berat produk"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  disabled={submitting}
                  className="w-full"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="condition"
                  className="text-sm font-medium text-gray-700"
                >
                  Kondisi*
                </Label>
                <Select
                  value={condition}
                  onValueChange={setCondition}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kondisi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Baru</SelectItem>
                    <SelectItem value="used">Bekas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                Deskripsi
              </Label>
              <div className="border rounded-md p-2 min-h-[200px] bg-white">
                <EditorContent
                  editor={editor}
                  className="prose max-w-none min-h-[180px]"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={editor?.isActive("bold") ? "bg-gray-200" : ""}
                >
                  Bold
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={editor?.isActive("italic") ? "bg-gray-200" : ""}
                >
                  Italic
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    editor?.chain().focus().toggleBulletList().run()
                  }
                  className={
                    editor?.isActive("bulletList") ? "bg-gray-200" : ""
                  }
                >
                  Bullet List
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = window.prompt("Enter image URL");
                    if (url) {
                      editor?.chain().focus().setImage({ src: url }).run();
                    }
                  }}
                >
                  Add Image
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="image"
                  className="text-sm font-medium text-gray-700"
                >
                  Gambar Utama Produk
                </Label>
                <div className="mt-1 flex items-center">
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Pilih Gambar Utama
                  </label>
                  <input
                    id="image-upload"
                    name="image-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e, true)}
                    disabled={submitting}
                  />
                  <span className="ml-3 text-sm text-gray-500">
                    {imageFile ? imageFile.name : "Belum ada file dipilih"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Format: JPG, PNG, GIF. Ukuran maksimal: 5MB
                </p>

                {imagePreview && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Preview Gambar Utama:
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

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Gambar Tambahan (Maksimal 5)
                  </Label>
                  {additionalImages.length < 5 && (
                    <div>
                      <label
                        htmlFor="additional-image-upload"
                        className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Gambar
                      </label>
                      <input
                        id="additional-image-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, false)}
                        disabled={submitting || additionalImages.length >= 5}
                      />
                    </div>
                  )}
                </div>

                {additionalImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-2">
                    {additionalImages.map((img, index) => (
                      <div
                        key={index}
                        className="relative w-full aspect-square overflow-hidden rounded-md border border-gray-200"
                      >
                        <img
                          src={img.preview}
                          alt={`Additional ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                          onClick={() => handleRemoveAdditionalImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Belum ada gambar tambahan
                  </p>
                )}
              </div>
            </div>

            {/* Sambatan Options */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-base">
                    Aktifkan Sambatan (Patungan)
                  </Label>
                  <p className="text-sm text-gray-500">
                    Izinkan pembeli untuk membeli produk ini secara patungan
                  </p>
                </div>
                <Switch
                  checked={enableSambatan}
                  onCheckedChange={setEnableSambatan}
                  disabled={submitting}
                />
              </div>
            </div>

            {enableSambatan && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="minParticipants"
                    className="text-sm font-medium text-gray-700"
                  >
                    Minimal Peserta*
                  </Label>
                  <Input
                    id="minParticipants"
                    type="number"
                    placeholder="Minimal peserta"
                    value={minParticipants}
                    onChange={(e) => setMinParticipants(e.target.value)}
                    disabled={submitting}
                    className="w-full"
                    min="2"
                  />
                  <p className="text-xs text-gray-500">
                    Minimal jumlah peserta untuk sambatan
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="maxParticipants"
                    className="text-sm font-medium text-gray-700"
                  >
                    Maksimal Peserta*
                  </Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    placeholder="Maksimal peserta"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    disabled={submitting}
                    className="w-full"
                    min="2"
                  />
                  <p className="text-xs text-gray-500">
                    Maksimal jumlah peserta untuk sambatan
                  </p>
                </div>
              </div>
            )}

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


