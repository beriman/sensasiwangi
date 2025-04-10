import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ShoppingCart, Heart, Search, Filter } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import MainLayout from "../layout/MainLayout";

interface MarketplaceLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function MarketplaceLayout({
  children,
  title,
  subtitle,
}: MarketplaceLayoutProps) {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Marketplace Header */}
        {(title || subtitle) && (
          <div className="text-center mb-8">
            {title && (
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            )}
            {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div className="flex flex-wrap gap-3">
            <Link to="/marketplace">
              <Button variant="outline" className="bg-white">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Semua Produk
              </Button>
            </Link>
            <Link to="/marketplace/sambatan">
              <Button variant="outline" className="bg-white">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Sambatan
              </Button>
            </Link>
            <Link to="/marketplace/wishlist">
              <Button variant="outline" className="bg-white">
                <Heart className="h-4 w-4 mr-2" />
                Wishlist
              </Button>
            </Link>
            {user && (
              <Link to="/marketplace/my-shop">
                <Button variant="outline" className="bg-white">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Toko Saya
                </Button>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/marketplace/cart">
              <Button variant="outline" className="relative bg-white">
                <ShoppingCart className="h-4 w-4" />
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-purple-600">
                  0
                </Badge>
              </Button>
            </Link>
          </div>
        </div>

        {/* Marketplace Content */}
        <div>{children}</div>
      </div>
    </MainLayout>
  );
}
