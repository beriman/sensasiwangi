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
import { CheckCircle, XCircle, AlertCircle, Eye } from "lucide-react";

type Order = {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  amount: number;
  payment_proof: string | null;
  status: string;
  created_at: string;
  product_name: string;
  product_description: string | null;
  buyer: { full_name: string; email: string };
  seller: { full_name: string; email: string };
};

const OrderVerification = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("marketplace_transactions")
        .select(
          `
          *,
          seller:seller_id(id, full_name, email),
          buyer:buyer_id(id, full_name, email)
        `,
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      toast({
        variant: "destructive",
        title: "Error fetching orders",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("marketplace_transactions")
        .update({ status: "verified", updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;

      // Update local state
      setOrders(orders.filter((order) => order.id !== orderId));

      toast({
        title: "Order verified",
        description:
          "The payment has been verified and the seller has been notified.",
      });
    } catch (error) {
      console.error("Error verifying order:", error);
      toast({
        variant: "destructive",
        title: "Error verifying order",
        description: "Please try again later.",
      });
    }
  };

  const rejectOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("marketplace_transactions")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;

      // Update local state
      setOrders(orders.filter((order) => order.id !== orderId));

      toast({
        title: "Order rejected",
        description:
          "The payment has been rejected and the buyer has been notified.",
      });
    } catch (error) {
      console.error("Error rejecting order:", error);
      toast({
        variant: "destructive",
        title: "Error rejecting order",
        description: "Please try again later.",
      });
    }
  };

  const viewPaymentProof = (proofUrl: string | null) => {
    if (!proofUrl) {
      toast({
        variant: "destructive",
        title: "No payment proof",
        description: "This order does not have a payment proof attached.",
      });
      return;
    }

    window.open(proofUrl, "_blank");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" /> Verified
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <AlertCircle className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center justify-between">
          <span>Order Verification</span>
          <Button
            onClick={fetchPendingOrders}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Buyer</th>
                <th className="px-6 py-3">Seller</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {order.product_name}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {order.product_description}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {order.buyer?.full_name || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.buyer?.email || ""}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {order.seller?.full_name || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.seller?.email || ""}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Rp {order.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => verifyOrder(order.id)}
                        variant="outline"
                        size="sm"
                        className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      >
                        Verify
                      </Button>
                      <Button
                        onClick={() => rejectOrder(order.id)}
                        variant="outline"
                        size="sm"
                        className="text-xs bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => viewPaymentProof(order.payment_proof)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" /> Proof
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No pending orders found
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    colSpan={7}
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
  );
};

export default OrderVerification;



