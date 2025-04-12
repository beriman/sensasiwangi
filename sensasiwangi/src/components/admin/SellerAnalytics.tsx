// @ts-ignore
import React, { useEffect, useState } from "react";
// @ts-ignore
import { supabase } from "../../../supabase/supabase";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
// @ts-ignore
import { Button } from "../ui/button";
// @ts-ignore
import { useToast } from "../ui/use-toast";
import {
  BarChart,
  LineChart,
  PieChart,
  DollarSign,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";
// @ts-ignore
import { MarketplaceProduct } from "../../types/marketplace";

interface AnalyticsData {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  topProducts: Array<MarketplaceProduct & { total_sold: number }>;
  monthlySales: Array<{ month: string; sales: number }>;
}

const SellerAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalSales: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    topProducts: [],
    monthlySales: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">(
    "month",
  );
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeframe]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // In a real implementation, these would be separate queries with proper joins
      // For demo purposes, we're using mock data

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data based on timeframe
      const mockData: AnalyticsData = {
        totalSales:
          timeframe === "week" ? 24 : timeframe === "month" ? 87 : 1045,
        totalRevenue:
          timeframe === "week"
            ? 2400000
            : timeframe === "month"
              ? 8700000
              : 104500000,
        totalProducts: 42,
        totalCustomers:
          timeframe === "week" ? 18 : timeframe === "month" ? 65 : 780,
        topProducts: [
          {
            id: "1",
            seller_id: "123",
            name: "Premium Parfum Base",
            description: "High-quality parfum base for professional perfumers",
            price: 350000,
            image_url:
              "https://images.unsplash.com/photo-1616604426506-0add61a6c2d8?w=800&q=80",
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            total_sold: 42,
          },
          {
            id: "2",
            seller_id: "123",
            name: "Jasmine Essential Oil",
            description: "Pure jasmine essential oil for perfume making",
            price: 275000,
            image_url:
              "https://images.unsplash.com/photo-1616604426506-0add61a6c2d8?w=800&q=80",
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            total_sold: 38,
          },
          {
            id: "3",
            seller_id: "123",
            name: "Perfume Bottle Set",
            description: "Set of 5 elegant perfume bottles",
            price: 120000,
            image_url:
              "https://images.unsplash.com/photo-1616604426506-0add61a6c2d8?w=800&q=80",
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            total_sold: 27,
          },
          {
            id: "4",
            seller_id: "123",
            name: "Sandalwood Fragrance",
            description: "Rich sandalwood fragrance concentrate",
            price: 420000,
            image_url:
              "https://images.unsplash.com/photo-1616604426506-0add61a6c2d8?w=800&q=80",
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            total_sold: 21,
          },
          {
            id: "5",
            seller_id: "123",
            name: "Perfumery Toolkit",
            description: "Complete toolkit for perfume making",
            price: 850000,
            image_url:
              "https://images.unsplash.com/photo-1616604426506-0add61a6c2d8?w=800&q=80",
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            total_sold: 15,
          },
        ],
        monthlySales: [
          { month: "Jan", sales: timeframe === "year" ? 85 : 0 },
          { month: "Feb", sales: timeframe === "year" ? 92 : 0 },
          { month: "Mar", sales: timeframe === "year" ? 78 : 0 },
          { month: "Apr", sales: timeframe === "year" ? 102 : 0 },
          { month: "May", sales: timeframe === "year" ? 110 : 0 },
          { month: "Jun", sales: timeframe === "year" ? 95 : 0 },
          {
            month: "Jul",
            sales: timeframe === "month" || timeframe === "year" ? 22 : 0,
          },
          {
            month: "Aug",
            sales: timeframe === "month" || timeframe === "year" ? 28 : 0,
          },
          {
            month: "Sep",
            sales: timeframe === "month" || timeframe === "year" ? 32 : 0,
          },
          {
            month: "Oct",
            sales: timeframe === "month" || timeframe === "year" ? 5 : 0,
          },
          {
            month: "Nov",
            sales:
              timeframe === "week" ||
              timeframe === "month" ||
              timeframe === "year"
                ? 12
                : 0,
          },
          {
            month: "Dec",
            sales:
              timeframe === "week" ||
              timeframe === "month" ||
              timeframe === "year"
                ? 12
                : 0,
          },
        ],
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast({
        variant: "destructive",
        title: "Error fetching analytics data",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Seller Analytics</h2>
        <div className="flex space-x-2">
          <Button
            variant={timeframe === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("week")}
          >
            Week
          </Button>
          <Button
            variant={timeframe === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("month")}
          >
            Month
          </Button>
          <Button
            variant={timeframe === "year" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("year")}
          >
            Year
          </Button>
          <Button
            onClick={fetchAnalyticsData}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-4 rounded-full bg-blue-100 p-2">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {analyticsData.totalSales}
                </div>
                <div className="text-xs text-gray-500">orders</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-4 rounded-full bg-green-100 p-2">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrency(analyticsData.totalRevenue)}
                </div>
                <div className="text-xs text-gray-500">revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-4 rounded-full bg-purple-100 p-2">
                <BarChart className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {analyticsData.totalProducts}
                </div>
                <div className="text-xs text-gray-500">products</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-4 rounded-full bg-yellow-100 p-2">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {analyticsData.totalCustomers}
                </div>
                <div className="text-xs text-gray-500">customers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded overflow-hidden bg-gray-100 mr-3">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 m-2 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(product.price)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-lg font-bold mr-2">
                      {product.total_sold}
                    </div>
                    <div className="text-xs text-gray-500">sold</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {/* This would be a real chart in production */}
              <div className="h-full w-full flex items-end justify-between">
                {analyticsData.monthlySales.map((data, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div
                      className="bg-blue-500 w-8 rounded-t"
                      style={{
                        height: `${data.sales > 0 ? (data.sales / Math.max(...analyticsData.monthlySales.map((d) => d.sales))) * 200 : 0}px`,
                        minHeight: data.sales > 0 ? "4px" : "0",
                      }}
                    ></div>
                    <div className="text-xs mt-2">{data.month}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-500">
                  Conversion Rate
                </div>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div className="mt-2 text-2xl font-bold">4.8%</div>
              <div className="mt-1 text-xs text-green-500">
                +0.5% from last {timeframe}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-500">
                  Avg. Order Value
                </div>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div className="mt-2 text-2xl font-bold">
                {formatCurrency(275000)}
              </div>
              <div className="mt-1 text-xs text-green-500">
                +5% from last {timeframe}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-500">
                  Repeat Customers
                </div>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div className="mt-2 text-2xl font-bold">38%</div>
              <div className="mt-1 text-xs text-green-500">
                +2% from last {timeframe}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerAnalytics;



