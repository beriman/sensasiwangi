import React, { useState, useEffect } from "react";
import MarketplaceLayout from "./MarketplaceLayout";
import SambatanGrid from "./SambatanGrid";
import SambatanCard from "./SambatanCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, Search, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { getSambatans } from "@/lib/sambatan";
import { Sambatan } from "@/types/marketplace";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function SambatanList() {
  const [sambatans, setSambatans] = useState<Sambatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSambatans = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSambatans();
      setSambatans(data);
    } catch (err) {
      console.error("Error fetching sambatans:", err);
      setError("Gagal memuat data Sambatan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSambatans();
  }, []);

  const filteredSambatans = sambatans.filter((sambatan) => {
    const productName = sambatan.product?.name?.toLowerCase() || "";
    const initiatorName = sambatan.initiator?.full_name?.toLowerCase() || "";
    const searchLower = searchTerm.toLowerCase();

    return (
      productName.includes(searchLower) || initiatorName.includes(searchLower)
    );
  });

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
              <h3 className="font-medium mb-2">Bayar & Terima</h3>
              <p className="text-sm text-gray-500">
                Setelah kuota tercapai, lakukan pembayaran dan terima produk
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className="text-xl font-semibold">Sambatan Aktif</h2>
          <div className="flex items-center mt-2 md:mt-0 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari sambatan..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="ml-2"
              onClick={fetchSambatans}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
            {error}
            <Button
              variant="link"
              className="ml-2 p-0 h-auto text-red-600 underline"
              onClick={fetchSambatans}
            >
              Coba lagi
            </Button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="flex flex-col space-y-3">
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : filteredSambatans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSambatans.map((sambatan) => (
              <SambatanCard key={sambatan.id} sambatan={sambatan} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Filter className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {searchTerm
                ? "Tidak ada sambatan yang sesuai"
                : "Belum ada sambatan aktif"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? `Tidak ada sambatan yang cocok dengan "${searchTerm}"`
                : "Saat ini belum ada sambatan yang aktif. Coba lagi nanti atau buat sambatan baru."}
            </p>
            <Link to="/marketplace">
              <Button variant="outline" className="mr-2">
                Kembali ke Marketplace
              </Button>
            </Link>
          </div>
        )}
      </div>
    </MarketplaceLayout>
  );
}
