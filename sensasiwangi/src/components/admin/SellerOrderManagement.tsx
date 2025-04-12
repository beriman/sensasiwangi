// @ts-ignore
import React, { useEffect, useState } from "react";
// @ts-ignore
import { supabase } from "../../../supabase/supabase";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
// @ts-ignore
import { Button } from "../ui/button";
// @ts-ignore
import { Badge } from "../ui/badge";
// @ts-ignore
import { useToast } from "../ui/use-toast";
// @ts-ignore
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
// @ts-ignore
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Eye,
  Package,
  Search,
  TruckIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  payment_status: "pending" | "verified" | "rejected";
  payment_proof: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  buyer?: {
    full_name: string;
    avatar_url: string | null;
  };
  product?: {
    name: string;
    image_url: string | null;
  };
}

const SellerOrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // In a real implementation, this would be a proper Supabase query
      // For demo purposes, we're using mock data

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate mock orders
      const mockOrders: Order[] = Array.from({ length: 20 }, (_, i) => ({
        id: `order-${i + 1}`,
        buyer_id: `buyer-${(i % 5) + 1}`,
        seller_id: "current-seller-id",
        product_id: `product-${(i % 10) + 1}`,
        quantity: Math.floor(Math.random() * 5) + 1,
        total_price: Math.floor(Math.random() * 500000) + 50000,
        status: ["pending", "processing", "shipped", "delivered", "cancelled"][
          i % 5
        ] as any,
        payment_status: ["pending", "verified", "rejected"][i % 3] as any,
        payment_proof:
          i % 3 === 0
            ? null
            : "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
        tracking_number: ["pending", "processing"].includes(
          ["pending", "processing", "shipped", "delivered", "cancelled"][i % 5],
        )
          ? null
          : `TRK${100000 + i}`,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        updated_at: new Date(Date.now() - i * 43200000).toISOString(),
        buyer: {
          full_name: `Customer ${(i % 5) + 1}`,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=customer-${(i % 5) + 1}`,
        },
        product: {
          name: `Product ${(i % 10) + 1}`,
          image_url:
            "https://images.unsplash.com/photo-1616604426506-0add61a6c2d8?w=800&q=80",
        },
      }));

      // Filter based on active tab
      let filteredOrders = mockOrders;
      if (activeTab !== "all") {
        filteredOrders = mockOrders.filter(
          (order) => order.status === activeTab,
        );
      }

      setOrders(filteredOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        variant: "destructive",
        title: "Error fetching orders",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      // In a real implementation, this would update the database
      const { data, error } = await supabase
        .from("marketplace_orders")
        .update({
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setOrders(
        orders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: status as any,
                updated_at: new Date().toISOString(),
              }
            : order,
        ),
      );

      // Send notification to buyer
      try {
        await supabase.functions.invoke("send_order_notification", {
          body: {
            orderId: orderId,
            status: status,
            recipientId: orders.find((o) => o.id === orderId)?.buyer_id,
          },
        });
      } catch (notifError) {
        console.error("Error sending notification:", notifError);
        // Continue even if notification fails
      }

      toast({
        title: "Order updated",
        description: `Order status changed to ${status}`,
      });

      // Close dialog if open
      if (isDialogOpen) {
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        variant: "destructive",
        title: "Error updating order",
        description: "Please try again later.",
      });
    }
  };

  const updateTrackingNumber = async (
    orderId: string,
    trackingNumber: string,
  ) => {
    try {
      // In a real implementation, this would update the database
      // For demo purposes, we're just updating the local state

      setOrders(
        orders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                tracking_number: trackingNumber,
                status: "shipped",
                updated_at: new Date().toISOString(),
              }
            : order,
        ),
      );

      toast({
        title: "Tracking updated",
        description: `Tracking number added and order marked as shipped`,
      });

      // Close dialog if open
      if (isDialogOpen) {
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Error updating tracking:", error);
      toast({
        variant: "destructive",
        title: "Error updating tracking",
        description: "Please try again later.",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "processing":
        return <Badge className="bg-blue-500">Processing</Badge>;
      case "shipped":
        return <Badge className="bg-purple-500">Shipped</Badge>;
      case "delivered":
        return <Badge className="bg-green-500">Delivered</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "verified":
        return <Badge className="bg-green-500">Verified</Badge>;
      case "rejected":
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const filteredOrders = orders.filter((order) => {
    // Apply search filter
    const searchMatch =
      searchTerm === "" ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.buyer?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product?.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Apply status filter
    const statusMatch = statusFilter === "all" || order.status === statusFilter;

    // Apply payment filter
    const paymentMatch =
      paymentFilter === "all" || order.payment_status === paymentFilter;

    return searchMatch && statusMatch && paymentMatch;
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <Button
          onClick={fetchOrders}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="shipped">Shipped</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center justify-between">
            <span>Orders</span>
            <div className="flex space-x-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Payment</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <img
                            className="h-8 w-8 rounded-full"
                            src={
                              order.buyer?.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${order.buyer_id}`
                            }
                            alt=""
                          />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {order.buyer?.full_name || "Unknown"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <img
                            className="h-8 w-8 rounded object-cover"
                            src={order.product?.image_url || ""}
                            alt=""
                          />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {order.product?.name || "Unknown Product"}
                          </div>
                          <div className="text-sm text-gray-500">
                            Qty: {order.quantity}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.total_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentStatusBadge(order.payment_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        onClick={() => handleViewOrder(order)}
                        variant="outline"
                        size="sm"
                        className="mr-2"
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No orders found
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      Loading orders...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Order Information
                  </h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Order ID:</span>
                      <span className="text-sm font-medium">
                        {selectedOrder.id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Date:</span>
                      <span className="text-sm font-medium">
                        {formatDate(selectedOrder.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span>{getStatusBadge(selectedOrder.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Payment:</span>
                      <span>
                        {getPaymentStatusBadge(selectedOrder.payment_status)}
                      </span>
                    </div>
                    {selectedOrder.tracking_number && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Tracking:</span>
                        <span className="text-sm font-medium">
                          {selectedOrder.tracking_number}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Customer Information
                  </h3>
                  <div className="mt-2 flex items-center">
                    <img
                      className="h-10 w-10 rounded-full mr-3"
                      src={
                        selectedOrder.buyer?.avatar_url ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedOrder.buyer_id}`
                      }
                      alt=""
                    />
                    <div>
                      <div className="text-sm font-medium">
                        {selectedOrder.buyer?.full_name || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">
                        Customer ID: {selectedOrder.buyer_id}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Product Information
                </h3>
                <div className="mt-2 border rounded-lg p-4">
                  <div className="flex items-center">
                    <img
                      className="h-16 w-16 rounded object-cover mr-4"
                      src={selectedOrder.product?.image_url || ""}
                      alt=""
                    />
                    <div>
                      <div className="text-lg font-medium">
                        {selectedOrder.product?.name || "Unknown Product"}
                      </div>
                      <div className="text-sm text-gray-500">
                        Quantity: {selectedOrder.quantity}
                      </div>
                      <div className="text-sm font-medium mt-1">
                        {formatCurrency(selectedOrder.total_price)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedOrder.payment_proof && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Payment Proof
                  </h3>
                  <div className="mt-2">
                    <img
                      src={selectedOrder.payment_proof}
                      alt="Payment Proof"
                      className="max-h-40 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  Update Order
                </h3>

                {/* Status Update Buttons */}
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.status !== "processing" &&
                    selectedOrder.payment_status === "verified" && (
                      <Button
                        onClick={() =>
                          updateOrderStatus(selectedOrder.id, "processing")
                        }
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                      >
                        <Package className="h-4 w-4 mr-1" /> Mark as Processing
                      </Button>
                    )}

                  {selectedOrder.status !== "shipped" &&
                    ["processing"].includes(selectedOrder.status) && (
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Enter tracking number"
                          className="w-48 h-9"
                          id="tracking-input"
                        />
                        <Button
                          onClick={() => {
                            const trackingInput = document.getElementById(
                              "tracking-input",
                            ) as HTMLInputElement;
                            if (trackingInput && trackingInput.value) {
                              updateTrackingNumber(
                                selectedOrder.id,
                                trackingInput.value,
                              );
                            } else {
                              toast({
                                variant: "destructive",
                                title: "Tracking number required",
                                description: "Please enter a tracking number",
                              });
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="flex items-center"
                        >
                          <TruckIcon className="h-4 w-4 mr-1" /> Ship Order
                        </Button>
                      </div>
                    )}

                  {selectedOrder.status !== "delivered" &&
                    selectedOrder.status === "shipped" && (
                      <Button
                        onClick={() =>
                          updateOrderStatus(selectedOrder.id, "delivered")
                        }
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Mark as
                        Delivered
                      </Button>
                    )}

                  {selectedOrder.status !== "cancelled" &&
                    !["delivered", "cancelled"].includes(
                      selectedOrder.status,
                    ) && (
                      <Button
                        onClick={() =>
                          updateOrderStatus(selectedOrder.id, "cancelled")
                        }
                        variant="outline"
                        size="sm"
                        className="flex items-center text-red-500 hover:text-red-600"
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Cancel Order
                      </Button>
                    )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerOrderManagement;



