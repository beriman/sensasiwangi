import React from "react";
import MarketplaceLayout from "./MarketplaceLayout";
import SambatanGrid from "./SambatanGrid";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function SambatanList() {
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
        <h2 className="text-xl font-semibold mb-4">Sambatan Aktif</h2>
        <SambatanGrid />
      </div>
    </MarketplaceLayout>
  );
}
