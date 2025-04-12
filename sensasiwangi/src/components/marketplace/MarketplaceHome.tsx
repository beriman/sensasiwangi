// @ts-ignore
import React, { useState } from "react";
// @ts-ignore
import MarketplaceLayout from "./MarketplaceLayout";
// @ts-ignore
import ProductGrid from "./ProductGrid";
// @ts-ignore
import { Button } from "../../components/ui/button";
import {
  Search,
  Filter,
  ChevronDown,
  ShoppingBag,
  Users,
  Percent,
  Clock,
  Truck,
} from "lucide-react";
// @ts-ignore
import { Input } from "../../components/ui/input";
// @ts-ignore
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
// @ts-ignore
import { Card, CardContent } from "../../components/ui/card";

export default function MarketplaceHome() {
  const [activeCategory, setActiveCategory] = useState("all");

  return (
    <MarketplaceLayout
      title="Marketplace Sensasiwangi"
      subtitle="Temukan parfum dan bahan parfum dari komunitas perfumer Indonesia"
    >
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari parfum, bahan parfum, atau alat perfumery..."
              className="pl-10 border-gray-200"
            />
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            Cari
          </Button>
          <Button variant="outline" className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filter
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

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
            onClick={() => setActiveCategory("sambatan")}
          >
            <Users className="h-4 w-4 mr-2" />
            Sambatan Aktif
          </Button>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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
      </div>

      {/* Banner for Sambatan */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg p-6 mb-6 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Fitur Sambatan (Patungan)</h2>
          <p className="mb-4">
            Ingin membeli produk bersama teman-teman? Gunakan fitur Sambatan
            untuk patungan dan dapatkan harga lebih hemat!
          </p>
          <Button className="bg-white text-purple-600 hover:bg-gray-100">
            <Users className="h-4 w-4 mr-2" />
            Lihat Sambatan Aktif
          </Button>
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
          <ProductGrid />
        </TabsContent>
        <TabsContent value="popular">
          <ProductGrid />
        </TabsContent>
        <TabsContent value="promo">
          <ProductGrid />
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


