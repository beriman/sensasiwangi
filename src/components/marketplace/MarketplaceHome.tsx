import React, { useState } from "react";
import MarketplaceLayout from "./MarketplaceLayout";
import ProductGrid from "./ProductGrid";
import SearchBar from "./SearchBar";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  Users,
  Percent,
  Clock,
  Truck,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useSearchParams } from "react-router-dom";

export default function MarketplaceHome() {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const [activeCategory, setActiveCategory] = useState(categoryParam || "all");

  const handleSearch = (query: string, filters: any) => {
    console.log("Search query:", query, "Filters:", filters);
    // Filters will be handled by the URL parameters and ProductGrid component
  };

  return (
    <MarketplaceLayout
      title="Marketplace Sensasiwangi"
      subtitle="Temukan parfum dan bahan parfum dari komunitas perfumer Indonesia"
    >
      {/* Search and Filter Bar */}
      <SearchBar onSearch={handleSearch} />

      {/* Categories */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-2 pb-2 min-w-max">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            className={`rounded-full whitespace-nowrap ${activeCategory === "all" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            Semua Produk
          </Button>
          <Button
            variant={activeCategory === "parfum" ? "default" : "outline"}
            className={`rounded-full whitespace-nowrap ${activeCategory === "parfum" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
            onClick={() => setActiveCategory("parfum")}
          >
            Parfum Jadi
          </Button>
          <Button
            variant={activeCategory === "bahan" ? "default" : "outline"}
            className={`rounded-full whitespace-nowrap ${activeCategory === "bahan" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
            onClick={() => setActiveCategory("bahan")}
          >
            Bahan Baku
          </Button>
          <Button
            variant={activeCategory === "alat" ? "default" : "outline"}
            className={`rounded-full whitespace-nowrap ${activeCategory === "alat" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
            onClick={() => setActiveCategory("alat")}
          >
            Alat Perfumery
          </Button>
          <Button
            variant={activeCategory === "sambatan" ? "default" : "outline"}
            className={`rounded-full whitespace-nowrap ${activeCategory === "sambatan" ? "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white" : ""}`}
            onClick={() => window.location.href = "/marketplace/sambatan"}
          >
            <Users className="h-4 w-4 mr-2" />
            Sambatan Aktif
          </Button>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Link to="/marketplace?category=parfum">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-none hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center">
              <div className="bg-purple-100 rounded-full p-3 mr-3">
                <ShoppingBag className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium">Parfum Jadi</h3>
                <p className="text-xs text-gray-500">50+ produk</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/marketplace?promo=true">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-none hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center">
              <div className="bg-blue-100 rounded-full p-3 mr-3">
                <Percent className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">Promo</h3>
                <p className="text-xs text-gray-500">Diskon hingga 50%</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/marketplace?flash_sale=true">
          <Card className="bg-gradient-to-br from-green-50 to-teal-50 border-none hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center">
              <div className="bg-green-100 rounded-full p-3 mr-3">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Flash Sale</h3>
                <p className="text-xs text-gray-500">Berakhir dalam 2 jam</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/marketplace/sambatan">
          <Card className="bg-gradient-to-br from-pink-50 to-red-50 border-none hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4 flex items-center">
              <div className="bg-pink-100 rounded-full p-3 mr-3">
                <Users className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-medium">Sambatan</h3>
                <p className="text-xs text-gray-500">Beli bersama, lebih hemat</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Banner for Sambatan */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg p-6 mb-6 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Fitur Sambatan (Patungan)</h2>
          <p className="mb-4">
            Ingin membeli produk bersama teman-teman? Gunakan fitur Sambatan
            untuk patungan dan dapatkan harga lebih hemat!
          </p>
          <Link to="/marketplace/sambatan">
            <Button className="bg-white text-purple-600 hover:bg-gray-100">
              <Users className="h-4 w-4 mr-2" />
              Lihat Sambatan Aktif
            </Button>
          </Link>
        </div>
      </div>

      {/* Product Tabs */}
      <Tabs defaultValue="newest" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="newest">Terbaru</TabsTrigger>
          <TabsTrigger value="popular">Terpopuler</TabsTrigger>
          <TabsTrigger value="promo">Promo</TabsTrigger>
        </TabsList>
        <TabsContent value="newest">
          <ProductGrid
            category={activeCategory !== "all" ? activeCategory : undefined}
            limit={12}
          />
        </TabsContent>
        <TabsContent value="popular">
          <ProductGrid
            category={activeCategory !== "all" ? activeCategory : undefined}
            limit={12}
          />
        </TabsContent>
        <TabsContent value="promo">
          <ProductGrid
            category={activeCategory !== "all" ? activeCategory : undefined}
            limit={12}
          />
        </TabsContent>
      </Tabs>

      {/* How Escrow Works */}
      <div className="bg-white rounded-lg p-6 border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold mb-6 text-center">
          Cara Kerja Rekening Bersama
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="font-bold text-purple-600">1</span>
            </div>
            <h3 className="font-medium mb-2">Pembayaran</h3>
            <p className="text-sm text-gray-500">
              Pembeli transfer ke rekening bersama admin
            </p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="font-bold text-purple-600">2</span>
            </div>
            <h3 className="font-medium mb-2">Verifikasi</h3>
            <p className="text-sm text-gray-500">
              Admin verifikasi pembayaran dan notifikasi penjual
            </p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="font-bold text-purple-600">3</span>
            </div>
            <h3 className="font-medium mb-2">Pengiriman</h3>
            <p className="text-sm text-gray-500">
              Penjual kirim barang dan input nomor resi
            </p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="font-bold text-purple-600">4</span>
            </div>
            <h3 className="font-medium mb-2">Selesai</h3>
            <p className="text-sm text-gray-500">
              Pembeli konfirmasi penerimaan, dana dilepas ke penjual
            </p>
          </div>
        </div>
      </div>
    </MarketplaceLayout>
  );
}
