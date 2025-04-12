import React from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import SellerAnalytics from "../../components/admin/SellerAnalytics";

const SellerAnalyticsPage = () => {
  return (
    <AdminLayout activeTab="seller-analytics">
      <SellerAnalytics />
    </AdminLayout>
  );
};

export default SellerAnalyticsPage;

