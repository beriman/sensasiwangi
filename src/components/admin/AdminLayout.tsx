import React from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../../../supabase/auth";
import { LoadingScreen } from "../ui/loading-spinner";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
}

const AdminLayout = ({ children, activeTab }: AdminLayoutProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Check if user is loading
  if (loading) {
    return <LoadingScreen text="Loading admin panel..." />;
  }

  // Redirect if not admin
  if (
    !user ||
    !user.user_metadata?.role ||
    user.user_metadata.role !== "admin"
  ) {
    navigate("/dashboard");
    return null;
  }

  const handleTabChange = (value: string) => {
    navigate(`/admin/${value}`);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage users, transactions, and platform settings
          </p>

          <div className="mt-6">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="w-full justify-start bg-gray-100 p-1 rounded-md">
                <TabsTrigger value="users" className="px-4 py-2">
                  Users
                </TabsTrigger>
                <TabsTrigger value="transactions" className="px-4 py-2">
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="orders" className="px-4 py-2">
                  Orders
                </TabsTrigger>
                <TabsTrigger value="products" className="px-4 py-2">
                  Products
                </TabsTrigger>
                <TabsTrigger value="badges" className="px-4 py-2">
                  Badges
                </TabsTrigger>
                <TabsTrigger value="seasonal-events" className="px-4 py-2">
                  Seasonal Events
                </TabsTrigger>
                <TabsTrigger value="sambatan" className="px-4 py-2">
                  Sambatan
                </TabsTrigger>
                <TabsTrigger value="seller-analytics" className="px-4 py-2">
                  Seller Analytics
                </TabsTrigger>
                <TabsTrigger value="seller-orders" className="px-4 py-2">
                  Seller Orders
                </TabsTrigger>
                <TabsTrigger value="financial" className="px-4 py-2">
                  Financial
                </TabsTrigger>
                <TabsTrigger value="statistics" className="px-4 py-2">
                  Statistics
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">{children}</div>
    </div>
  );
};

export default AdminLayout;
