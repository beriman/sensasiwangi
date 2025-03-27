import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabase/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, TrendingUp, DollarSign, Calendar } from "lucide-react";

type FinancialData = {
  totalTransactions: number;
  totalRevenue: number;
  pendingTransactions: number;
  pendingAmount: number;
  completedTransactions: number;
  completedAmount: number;
  sambatanTransactions: number;
  sambatanRevenue: number;
  recentTransactions: Array<{
    id: string;
    buyer_id: string;
    seller_id: string;
    product_id: string;
    total_price: number;
    status: string;
    created_at: string;
    buyer: {
      full_name: string;
    };
    seller: {
      full_name: string;
    };
    product: {
      name: string;
    };
  }>;
};

const FinancialReports = () => {
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalTransactions: 0,
    totalRevenue: 0,
    pendingTransactions: 0,
    pendingAmount: 0,
    completedTransactions: 0,
    completedAmount: 0,
    sambatanTransactions: 0,
    sambatanRevenue: 0,
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"all" | "month" | "week" | "day">(
    "month",
  );
  const { toast } = useToast();

  useEffect(() => {
    fetchFinancialData(timeframe);
  }, [timeframe]);

  const fetchFinancialData = async (
    period: "all" | "month" | "week" | "day",
  ) => {
    try {
      setLoading(true);

      // Calculate date range based on period
      let startDate = new Date();
      switch (period) {
        case "day":
          startDate.setDate(startDate.getDate() - 1);
          break;
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "all":
          // No date filtering for "all"
          startDate = new Date(0); // Beginning of time
          break;
      }

      const startDateStr = startDate.toISOString();

      // Get total transactions and revenue
      const { data: transactionsData, error: transactionsError } =
        await supabase
          .from("marketplace_transactions")
          .select("id, total_price, status, is_sambatan")
          .gte("created_at", period === "all" ? null : startDateStr);

      if (transactionsError) throw transactionsError;

      // Get recent transactions with details
      const { data: recentTransactions, error: recentError } = await supabase
        .from("marketplace_transactions")
        .select(
          `
          id, buyer_id, seller_id, product_id, total_price, status, created_at, is_sambatan,
          buyer:buyer_id(full_name),
          seller:seller_id(full_name),
          product:product_id(name)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(10);

      if (recentError) throw recentError;

      // Calculate statistics
      const totalTransactions = transactionsData?.length || 0;
      const totalRevenue =
        transactionsData?.reduce(
          (sum, item) => sum + (item.total_price || 0),
          0,
        ) || 0;

      const pendingTransactions =
        transactionsData?.filter((t) => t.status === "pending").length || 0;
      const pendingAmount =
        transactionsData
          ?.filter((t) => t.status === "pending")
          .reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;

      const completedTransactions =
        transactionsData?.filter((t) => t.status === "completed").length || 0;
      const completedAmount =
        transactionsData
          ?.filter((t) => t.status === "completed")
          .reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;

      const sambatanTransactions =
        transactionsData?.filter((t) => t.is_sambatan).length || 0;
      const sambatanRevenue =
        transactionsData
          ?.filter((t) => t.is_sambatan)
          .reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;

      setFinancialData({
        totalTransactions,
        totalRevenue,
        pendingTransactions,
        pendingAmount,
        completedTransactions,
        completedAmount,
        sambatanTransactions,
        sambatanRevenue,
        recentTransactions: recentTransactions || [],
      });
    } catch (error) {
      console.error("Error fetching financial data:", error);
      toast({
        variant: "destructive",
        title: "Error fetching financial data",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString()}`;
  };

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case "day":
        return "Last 24 Hours";
      case "week":
        return "Last 7 Days";
      case "month":
        return "Last 30 Days";
      case "all":
        return "All Time";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Financial Reports{" "}
          <span className="text-sm font-normal text-gray-500">
            {getTimeframeLabel()}
          </span>
        </h2>
        <div className="flex space-x-2">
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
            <TabsList>
              <TabsTrigger value="day" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" /> Day
              </TabsTrigger>
              <TabsTrigger value="week" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" /> Week
              </TabsTrigger>
              <TabsTrigger value="month" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" /> Month
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" /> All Time
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            onClick={() => fetchFinancialData(timeframe)}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-green-600">
              <DollarSign className="h-5 w-5 mr-2" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold">
                {formatCurrency(financialData.totalRevenue)}
              </p>
              <p className="text-sm text-gray-500">
                {financialData.totalTransactions} transactions
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Completed Transactions */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-blue-600">
              <CreditCard className="h-5 w-5 mr-2" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold">
                {formatCurrency(financialData.completedAmount)}
              </p>
              <p className="text-sm text-gray-500">
                {financialData.completedTransactions} transactions
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Transactions */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-amber-600">
              <CreditCard className="h-5 w-5 mr-2" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold">
                {formatCurrency(financialData.pendingAmount)}
              </p>
              <p className="text-sm text-gray-500">
                {financialData.pendingTransactions} transactions
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sambatan Revenue */}
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-purple-600">
              <TrendingUp className="h-5 w-5 mr-2" />
              Sambatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold">
                {formatCurrency(financialData.sambatanRevenue)}
              </p>
              <p className="text-sm text-gray-500">
                {financialData.sambatanTransactions} transactions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest marketplace transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2">Buyer</th>
                  <th className="px-4 py-2">Seller</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {financialData.recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-mono">
                      {transaction.id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {transaction.product?.name || "Unknown Product"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {transaction.buyer?.full_name || "Unknown Buyer"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {transaction.seller?.full_name || "Unknown Seller"}
                    </td>
                    <td className="px-4 py-2 text-sm font-medium">
                      {formatCurrency(transaction.total_price)}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.status === "completed" ? "bg-green-100 text-green-800" : transaction.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {transaction.is_sambatan ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Sambatan
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Regular
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {financialData.recentTransactions.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-2 text-center text-sm text-gray-500"
                    >
                      No recent transactions
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-2 text-center text-sm text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReports;
