import React from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import OrderVerification from "../../components/admin/OrderVerification";

const OrdersPage = () => {
  return (
    <AdminLayout activeTab="orders">
      <OrderVerification />
    </AdminLayout>
  );
};

export default OrdersPage;

