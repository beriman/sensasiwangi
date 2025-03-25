import React from "react";
import { Navigate, useParams } from "react-router-dom";
import AdminLayout from "../../admin/AdminLayout";
import UsersManagement from "../../admin/UsersManagement";
import TransactionsManagement from "../../admin/TransactionsManagement";
import BadgesManagement from "../../admin/BadgesManagement";
import StatisticsPanel from "../../admin/StatisticsPanel";
import SeasonalEventsManagement from "../../admin/SeasonalEventsManagement";

const AdminPanel = () => {
  const { tab = "users" } = useParams<{ tab?: string }>();

  // Validate tab parameter
  const validTabs = [
    "users",
    "transactions",
    "badges",
    "seasonal-events",
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
      {tab === "statistics" && <StatisticsPanel />}
    </AdminLayout>
  );
};

export default AdminPanel;
