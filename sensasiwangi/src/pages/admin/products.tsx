import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import ProductModeration from "@/components/admin/ProductModeration";

const ProductsPage = () => {
  return (
    <AdminLayout activeTab="products">
      <ProductModeration />
    </AdminLayout>
  );
};

export default ProductsPage;
