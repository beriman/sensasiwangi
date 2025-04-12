import React from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import SellerOrderManagement from "../../components/admin/SellerOrderManagement";

const SellerOrdersPage = () => {
  return (
    <AdminLayout activeTab="seller-orders">
      <SellerOrderManagement />
    </AdminLayout>
  );
};

export default SellerOrdersPage;

