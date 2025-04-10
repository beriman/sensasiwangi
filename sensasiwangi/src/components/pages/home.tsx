import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-provider";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  User,
  ShoppingBag,
  Award,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  return (
    <MainLayout withPadding={false}>
      {/* Hero section */}
      <section className="py-24 text-center bg-gradient-to-b from-white to-purple-50">
        <div className="max-w-[1200px] mx-auto px-4">
          <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-100">
            Community Platform
          </Badge>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            sensasiwangi.id
          </h2>
          <h3 className="text-2xl font-medium text-gray-600 mb-6 max-w-3xl mx-auto">
            Platform komunitas terlengkap untuk penggemar dan kreator wewangian Indonesia
          </h3>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6 text-xl">
            {!user ? (
              <Link to="/signup">
                <Button
                  size="lg"
                  className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90 px-8"
                >
                  Bergabung Sekarang
                </Button>
              </Link>
            ) : (
              <Link to="/forum">
                <Button
                  size="lg"
                  className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90 px-8"
                >
                  Jelajahi Forum
                </Button>
              </Link>
            )}
            <Link to="/marketplace">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                Kunjungi Marketplace
              </Button>
            </Link>
          </div>
          <div className="mt-16 relative">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100">
              <img
                src="https://images.unsplash.com/photo-1595425964377-155aa60d6e73?w=1200&q=80"
                alt="Sensasiwangi Platform"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-20 bg-white text-center">
        <div className="max-w-[1200px] mx-auto px-4">
          <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-100">
            Fitur Platform
          </Badge>
          <h2 className="text-4xl font-bold tracking-tight mb-2">
            Jelajahi Pengalaman sensasiwangi.id
          </h2>
          <h3 className="text-xl font-medium text-gray-600 mb-12 max-w-3xl mx-auto">
            Ekosistem lengkap untuk penggemar wewangian dengan interaksi yang menyenangkan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm text-left border border-purple-100 hover:shadow-md transition-all">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Forum Komunitas</h4>
              <p className="text-gray-600">
                Diskusikan dengan sesama penggemar wewangian dan bagikan pengetahuan Anda.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm text-left border border-purple-100 hover:shadow-md transition-all">
              <div className="h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="h-6 w-6 text-pink-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Marketplace</h4>
              <p className="text-gray-600">
                Jual dan beli wewangian, bahan baku, dan peralatan perfumery.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm text-left border border-purple-100 hover:shadow-md transition-all">
              <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Badge & Level</h4>
              <p className="text-gray-600">
                Dapatkan badge dan naik level dengan berpartisipasi aktif di komunitas.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm text-left border border-purple-100 hover:shadow-md transition-all">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Profil Lengkap</h4>
              <p className="text-gray-600">
                Tampilkan perjalanan, prestasi, dan koleksi wewangian Anda di profil.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Experience section */}
      <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-100">
                Forum Gamifikasi
              </Badge>
              <h2 className="text-3xl font-bold mb-4">
                Dapatkan Pengalaman & Badge
              </h2>
              <p className="text-gray-600 mb-6">
                Sistem pengalaman unik kami memberikan penghargaan untuk kontribusi Anda:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-purple-600 text-sm font-bold">
                      +1
                    </span>
                  </div>
                  <span className="text-gray-700">
                    Membuat thread baru di forum
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-purple-600 text-sm font-bold">
                      +2
                    </span>
                  </div>
                  <span className="text-gray-700">
                    Membalas thread atau komentar
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-purple-600 text-sm font-bold">
                      +5
                    </span>
                  </div>
                  <span className="text-gray-700">
                    Mendapatkan upvote pada thread atau komentar
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-purple-600 text-sm font-bold">
                      +10
                    </span>
                  </div>
                  <span className="text-gray-700">
                    Thread Anda ditandai sebagai solusi
                  </span>
                </li>
              </ul>
              <div className="mt-8">
                <Link to="/forum">
                  <Button className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90">
                    Mulai Berpartisipasi
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-5 -left-5 w-20 h-20 bg-purple-200 rounded-full mix-blend-multiply filter blur-lg opacity-70"></div>
              <div className="absolute -bottom-5 -right-5 w-20 h-20 bg-pink-200 rounded-full mix-blend-multiply filter blur-lg opacity-70"></div>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-purple-100 relative">
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-2"></div>
                <div className="p-6">
                  <div className="flex items-center mb-6">
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                      <Sparkles className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Level 5 Achieved!</h4>
                      <p className="text-sm text-gray-500">
                        You've earned the "Perfume Enthusiast" badge
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Level Progress</span>
                      <span className="text-sm text-gray-500">450/500 XP</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-pink-500 h-2.5 rounded-full"
                        style={{ width: "90%" }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Level 5</span>
                      <span>Level 6</span>
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="h-8 w-8 mx-auto mb-1">
                        <img
                          src="https://api.dicebear.com/7.x/shapes/svg?seed=badge1"
                          alt="Badge"
                          className="w-full h-full"
                        />
                      </div>
                      <span className="text-xs">Newbie</span>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="h-8 w-8 mx-auto mb-1">
                        <img
                          src="https://api.dicebear.com/7.x/shapes/svg?seed=badge2"
                          alt="Badge"
                          className="w-full h-full"
                        />
                      </div>
                      <span className="text-xs">Helper</span>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="h-8 w-8 mx-auto mb-1">
                        <img
                          src="https://api.dicebear.com/7.x/shapes/svg?seed=badge3"
                          alt="Badge"
                          className="w-full h-full"
                        />
                      </div>
                      <span className="text-xs">Expert</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace section */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-purple-100">
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-2"></div>
                <div className="p-6">
                  <h4 className="text-xl font-semibold mb-4">
                    Produk Marketplace
                  </h4>
                  <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="flex border-b border-gray-100 pb-4"
                      >
                        <div className="h-16 w-16 bg-purple-100 rounded-lg mr-4 overflow-hidden">
                          <img
                            src={`https://images.unsplash.com/photo-1595425964377-155aa60d6e73?w=200&q=80`}
                            alt="Product"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">
                            Parfum Sensasi Wangi {item}
                          </h5>
                          <p className="text-gray-500 text-xs mb-1">
                            Oleh: Perfumer {item}
                          </p>
                          <p className="text-purple-600 font-medium">
                            Rp 250.000
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <Badge className="mb-4 bg-purple-100 text-purple-800 hover:bg-purple-100">
                Marketplace
              </Badge>
              <h2 className="text-3xl font-bold mb-4">
                Jual Beli Wewangian dan Bahan Baku
              </h2>
              <p className="text-gray-600 mb-6">
                Marketplace kami menyediakan platform untuk:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-0.5">
                    <ShoppingBag className="h-3 w-3 text-purple-600" />
                  </div>
                  <span className="text-gray-700">
                    Jual beli parfum dan wewangian buatan sendiri
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-0.5">
                    <ShoppingBag className="h-3 w-3 text-purple-600" />
                  </div>
                  <span className="text-gray-700">
                    Bahan baku dan peralatan perfumery
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-0.5">
                    <ShoppingBag className="h-3 w-3 text-purple-600" />
                  </div>
                  <span className="text-gray-700">
                    Fitur Sambatan untuk kolaborasi pembelian bahan baku
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-0.5">
                    <ShoppingBag className="h-3 w-3 text-purple-600" />
                  </div>
                  <span className="text-gray-700">
                    Sistem review dan rating untuk memastikan kualitas
                  </span>
                </li>
              </ul>
              <div className="mt-8">
                <Link to="/marketplace">
                  <Button className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90">
                    Jelajahi Marketplace
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-center">
        <div className="max-w-[1200px] mx-auto px-4">
          <h2 className="text-4xl font-bold mb-4">
            Bergabunglah dengan Komunitas Wewangian Kami
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Terhubung dengan sesama penggemar, bagikan kreasi Anda, dan tingkatkan perjalanan wewangian Anda.
          </p>
          {!user ? (
            <Link to="/signup">
              <Button
                size="lg"
                className="rounded-full bg-white text-purple-600 hover:bg-gray-100 px-8"
              >
                Buat Akun Anda
              </Button>
            </Link>
          ) : (
            <Link to="/forum">
              <Button
                size="lg"
                className="rounded-full bg-white text-purple-600 hover:bg-gray-100 px-8"
              >
                Jelajahi Forum
              </Button>
            </Link>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
