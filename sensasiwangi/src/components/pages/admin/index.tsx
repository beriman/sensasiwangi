// @ts-ignore
import React from "react";
// @ts-ignore
import { Navigate, useParams } from "react-router-dom";
// @ts-ignore
import AdminLayout from "../../admin/AdminLayout";
// @ts-ignore
import UsersManagement from "../../admin/UsersManagement";
// @ts-ignore
import TransactionsManagement from "../../admin/TransactionsManagement";
// @ts-ignore
import BadgesManagement from "../../admin/BadgesManagement";
// @ts-ignore
import StatisticsPanel from "../../admin/StatisticsPanel";
// @ts-ignore
import SeasonalEventsManagement from "../../admin/SeasonalEventsManagement";
// @ts-ignore
import SambatanManagement from "../../admin/SambatanManagement";
// @ts-ignore
import ProductModeration from "../../admin/ProductModeration";
// @ts-ignore
import FinancialReports from "../../admin/FinancialReports";

const AdminPanel = () => {
  const { tab = "users" } = useParams<{ tab?: string }>();

  // Validate tab parameter
  const validTabs = [
    "users",
    "transactions",
    "badges",
    "seasonal-events",
    "sambatan",
    "products",
    "financial",
    "statistics",
  ];
  if (!validTabs.includes(tab)) {
    return <Navigate to="/admin/users" replace />;
  }

  return (
    <AdminLayout activeTab={tab}>
      {tab === "users" && <UsersManagement />}
      {tab === "transactions" && <TransactionsManagement />}
      {tab === "badges" && <BadgesManagement />}
      {tab === "seasonal-events" && <SeasonalEventsManagement />}
      {tab === "sambatan" && <SambatanManagement />}
      {tab === "products" && <ProductModeration />}
      {tab === "financial" && <FinancialReports />}
      {tab === "statistics" && <StatisticsPanel />}
    </AdminLayout>
  );
};

export default AdminPanel;

