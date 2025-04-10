import React, { useState, useEffect } from "react";
import MarketplaceLayout from "./MarketplaceLayout";
import SambatanGrid from "./SambatanGrid";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Filter,
  Search,
  RefreshCw,
  Users,
  Clock,
  TrendingUp,
  Tag,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getSambatans } from "@/lib/sambatan";
import { Sambatan } from "@/types/marketplace";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export default function SambatanList() {
  const [sambatans, setSambatans] = useState<Sambatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState({
    priceRange: [0, 10000000],
    categories: [] as string[],
    onlyAvailable: true,
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchSambatans = async () => {
      try {
        setLoading(true);
        const data = await getSambatans();
        setSambatans(data);

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(data.map((s) => s.product?.category).filter(Boolean))
        ) as string[];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error fetching sambatans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSambatans();
  }, []);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const data = await getSambatans();
      setSambatans(data);
    } catch (error) {
      console.error("Error refreshing sambatans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      priceRange: [0, 10000000],
      categories: [],
      onlyAvailable: true,
    });
    setSearchTerm("");
    setSortBy("newest");
    setActiveTab("all");
  };

  const filteredSambatans = sambatans
    .filter((sambatan) => {
      // Filter by search term
      const productName = sambatan.product?.name?.toLowerCase() || "";
      const initiatorName = sambatan.initiator?.full_name?.toLowerCase() || "";
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        productName.includes(searchLower) || initiatorName.includes(searchLower);

      // Filter by status
      const isExpired =
        sambatan.expires_at && new Date(sambatan.expires_at) < new Date();
      const matchesStatus =
        activeTab === "all" ||
        (activeTab === "open" &&
          sambatan.status === "open" &&
          !isExpired) ||
        (activeTab === "closed" &&
          (sambatan.status === "closed" || sambatan.status === "completed")) ||
        (activeTab === "expired" &&
          ((sambatan.status === "open" && isExpired) ||
            sambatan.status === "cancelled"));

      // Filter by price range
      const price = sambatan.product?.price || 0;
      const matchesPrice =
        price >= filters.priceRange[0] && price <= filters.priceRange[1];

      // Filter by category
      const matchesCategory =
        filters.categories.length === 0 ||
        filters.categories.includes(sambatan.product?.category || "");

      // Filter by availability
      const isAvailable =
        !filters.onlyAvailable ||
        (sambatan.status === "open" &&
          !isExpired &&
          sambatan.current_quantity < sambatan.target_quantity);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPrice &&
        matchesCategory &&
        isAvailable
      );
    })
    .sort((a, b) => {
      // Sort by selected option
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "price-low") {
        return (a.product?.price || 0) - (b.product?.price || 0);
      } else if (sortBy === "price-high") {
        return (b.product?.price || 0) - (a.product?.price || 0);
      } else if (sortBy === "progress") {
        const progressA = a.current_quantity / a.target_quantity;
        const progressB = b.current_quantity / b.target_quantity;
        return progressB - progressA;
      } else if (sortBy === "ending-soon") {
        const dateA = a.expires_at ? new Date(a.expires_at).getTime() : Infinity;
        const dateB = b.expires_at ? new Date(b.expires_at).getTime() : Infinity;
        return dateA - dateB;
      }
      return 0;
    });

  // Get popular categories (top 5)
  const popularCategories = categories
    .map((category) => ({
      name: category,
      count: sambatans.filter((s) => s.product?.category === category).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Get featured sambatans (most participants)
  const featuredSambatans = [...sambatans]
    .filter(
      (s) => s.status === "open" && new Date(s.expires_at || "") > new Date()
    )
    .sort((a, b) => b.current_quantity - a.current_quantity)
    .slice(0, 3);

  // Get ending soon sambatans
  const endingSoonSambatans = [...sambatans]
    .filter(
      (s) =>
        s.status === "open" &&
        s.expires_at &&
        new Date(s.expires_at) > new Date() &&
        new Date(s.expires_at).getTime() - new Date().getTime() <
          3 * 24 * 60 * 60 * 1000 // 3 days
    )
    .sort(
      (a, b) =>
        new Date(a.expires_at || "").getTime() -
        new Date(b.expires_at || "").getTime()
    )
    .slice(0, 3);

  return (
    <MarketplaceLayout
      title="Sambatan Aktif"
      subtitle="Beli bersama dengan komunitas Sensasiwangi"
    >
      <div className="flex items-center mb-6">
        <Link
          to="/marketplace"
          className="flex items-center text-purple-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali ke Marketplace
        </Link>
      </div>

      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mb-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            Apa itu Sambatan?
          </h2>
          <p className="text-gray-700 mb-4">
            Sambatan adalah fitur patungan yang memungkinkan Anda membeli produk
            bersama dengan pengguna lain. Dengan Sambatan, Anda bisa membeli
            produk dengan harga lebih terjangkau dan berbagi biaya pengiriman.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="bg-purple-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                <span className="font-bold text-purple-600">1</span>
              </div>
              <h3 className="font-medium mb-2">Buat Sambatan</h3>
              <p className="text-sm text-gray-500">
                Pilih produk dan tentukan jumlah peserta yang dibutuhkan
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="bg-purple-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                <span className="font-bold text-purple-600">2</span>
              </div>
              <h3 className="font-medium mb-2">Bagikan Link</h3>
              <p className="text-sm text-gray-500">
                Ajak teman-teman untuk bergabung dengan Sambatan Anda
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="bg-purple-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-3">
                <span className="font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-medium mb-2">Selesaikan Pembayaran</h3>
              <p className="text-sm text-gray-500">
                Bayar bagian Anda dan tunggu Sambatan selesai
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured and Ending Soon Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Featured Sambatans */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="font-semibold text-lg">Sambatan Populer</h3>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : featuredSambatans.length > 0 ? (
              <div className="space-y-3">
                {featuredSambatans.map((sambatan) => (
                  <Link
                    key={sambatan.id}
                    to={`/marketplace/sambatan/${sambatan.id}`}
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="h-12 w-12 bg-gray-200 rounded-md overflow-hidden mr-3">
                      {sambatan.product?.image_url ? (
                        <img
                          src={sambatan.product.image_url}
                          alt={sambatan.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {sambatan.product?.name}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Users className="h-3 w-3 mr-1" />
                        <span>
                          {sambatan.current_quantity}/{sambatan.target_quantity}{" "}
                          peserta
                        </span>
                      </div>
                    </div>
                    <Badge className="ml-2 bg-purple-100 text-purple-800">
                      {Math.round(
                        (sambatan.current_quantity / sambatan.target_quantity) *
                          100
                      )}
                      %
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                Belum ada sambatan populer
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ending Soon */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <Clock className="h-5 w-5 text-amber-600 mr-2" />
              <h3 className="font-semibold text-lg">Segera Berakhir</h3>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : endingSoonSambatans.length > 0 ? (
              <div className="space-y-3">
                {endingSoonSambatans.map((sambatan) => (
                  <Link
                    key={sambatan.id}
                    to={`/marketplace/sambatan/${sambatan.id}`}
                    className="flex items-center p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <div className="h-12 w-12 bg-gray-200 rounded-md overflow-hidden mr-3">
                      {sambatan.product?.image_url ? (
                        <img
                          src={sambatan.product.image_url}
                          alt={sambatan.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {sambatan.product?.name}
                      </p>
                      <div className="flex items-center text-xs text-amber-600">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          Berakhir{" "}
                          {new Date(
                            sambatan.expires_at || ""
                          ).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                    <Badge className="ml-2 bg-amber-100 text-amber-800">
                      {Math.round(
                        (sambatan.current_quantity / sambatan.target_quantity) *
                          100
                      )}
                      %
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                Tidak ada sambatan yang akan segera berakhir
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Popular Categories */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Tag className="h-5 w-5 text-purple-600 mr-2" />
          <h3 className="font-semibold text-lg">Kategori Populer</h3>
        </div>
        {loading ? (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-32 flex-shrink-0" />
            ))}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {popularCategories.map((category) => (
              <Button
                key={category.name}
                variant="outline"
                className={`flex-shrink-0 ${
                  filters.categories.includes(category.name)
                    ? "bg-purple-100 text-purple-800 border-purple-200"
                    : ""
                }`}
                onClick={() => {
                  if (filters.categories.includes(category.name)) {
                    handleFilterChange(
                      "categories",
                      filters.categories.filter((c) => c !== category.name)
                    );
                  } else {
                    handleFilterChange("categories", [
                      ...filters.categories,
                      category.name,
                    ]);
                  }
                }}
              >
                {category.name}{" "}
                <Badge className="ml-2 bg-gray-100 text-gray-800">
                  {category.count}
                </Badge>
              </Button>
            ))}
            <Button
              variant="ghost"
              className="flex-shrink-0 text-purple-600"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Sembunyikan Filter" : "Semua Filter"}
            </Button>
          </div>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari sambatan..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-8 w-8 text-gray-400"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Terbaru</SelectItem>
              <SelectItem value="oldest">Terlama</SelectItem>
              <SelectItem value="price-low">Harga: Rendah ke Tinggi</SelectItem>
              <SelectItem value="price-high">Harga: Tinggi ke Rendah</SelectItem>
              <SelectItem value="progress">Progress Tertinggi</SelectItem>
              <SelectItem value="ending-soon">Segera Berakhir</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
                {(filters.categories.length > 0 ||
                  !filters.onlyAvailable ||
                  filters.priceRange[0] > 0 ||
                  filters.priceRange[1] < 10000000) && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-purple-600 text-white">
                    !
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Kategori</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={filters.categories.includes(category)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleFilterChange("categories", [
                                ...filters.categories,
                                category,
                              ]);
                            } else {
                              handleFilterChange(
                                "categories",
                                filters.categories.filter((c) => c !== category)
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={`category-${category}`}
                          className="text-sm"
                        >
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Status</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="only-available"
                      checked={filters.onlyAvailable}
                      onCheckedChange={(checked) =>
                        handleFilterChange("onlyAvailable", !!checked)
                      }
                    />
                    <label htmlFor="only-available" className="text-sm">
                      Hanya tampilkan yang masih tersedia
                    </label>
                  </div>
                </div>
                <div className="pt-2 flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="text-gray-500"
                  >
                    Reset Filter
                  </Button>
                  <Button size="sm">Terapkan Filter</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="open">Terbuka</TabsTrigger>
          <TabsTrigger value="closed">Selesai</TabsTrigger>
          <TabsTrigger value="expired">Kedaluwarsa</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Applied Filters */}
      {(filters.categories.length > 0 ||
        !filters.onlyAvailable ||
        searchTerm) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {searchTerm && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 bg-gray-100"
            >
              Pencarian: {searchTerm}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 text-gray-500"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.categories.map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="flex items-center gap-1 bg-gray-100"
            >
              {category}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 text-gray-500"
                onClick={() =>
                  handleFilterChange(
                    "categories",
                    filters.categories.filter((c) => c !== category)
                  )
                }
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {!filters.onlyAvailable && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 bg-gray-100"
            >
              Termasuk yang tidak tersedia
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 text-gray-500"
                onClick={() => handleFilterChange("onlyAvailable", true)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gray-500"
            onClick={resetFilters}
          >
            Reset Semua
          </Button>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-6 text-sm text-gray-500">
        Menampilkan {filteredSambatans.length} dari {sambatans.length} sambatan
      </div>

      {/* Sambatan Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      ) : (
        <SambatanGrid sambatans={filteredSambatans} />
      )}
    </MarketplaceLayout>
  );
}
