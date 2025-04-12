// @ts-ignore
import React from "react";
// @ts-ignore
import { Routes, Route } from "react-router-dom";
// @ts-ignore
import MarketplaceLayout from "../../marketplace/MarketplaceLayout";
// @ts-ignore
import ProductGrid from "../../marketplace/ProductGrid";
// @ts-ignore
import ProductDetail from "../../marketplace/ProductDetail";
// @ts-ignore
import MyShop from "../../marketplace/MyShop";
// @ts-ignore
import ProductForm from "../../marketplace/ProductForm";

export default function Marketplace() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <MarketplaceLayout
            title="Marketplace Perfumer"
            subtitle="Jual beli bahan dan parfum dari komunitas perfumer"
          >
            <ProductGrid />
          </MarketplaceLayout>
        }
      />
      <Route
        path="/product/:productId"
        element={
          <MarketplaceLayout>
            <ProductDetail />
          </MarketplaceLayout>
        }
      />
      <Route
        path="/my-shop"
        element={
          <MarketplaceLayout>
            <MyShop />
          </MarketplaceLayout>
        }
      />
      <Route
        path="/my-shop/new"
        element={
          <MarketplaceLayout>
            <ProductForm mode="create" />
          </MarketplaceLayout>
        }
      />
      <Route
        path="/my-shop/edit/:productId"
        element={
          <MarketplaceLayout>
            <ProductForm mode="edit" />
          </MarketplaceLayout>
        }
      />
    </Routes>
  );
}

