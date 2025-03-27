import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  RefreshCw,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { getAllRefunds, updateRefundStatus } from "@/lib/dispute";
import { MarketplaceRefund } from "@/types/dispute";

const RefundManagement = () => {
  const [refunds, setRefunds] = useState<MarketplaceRefund[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<MarketplaceRefund | null>(null);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const data = await getAllRefunds();
      setRefunds(data);
    } catch (error) {
      console.error("Error fetching refunds:", error);
      toast({
        variant: "destructive",
        title: "Error fetching refunds",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (refund: MarketplaceRefund) => {
    setSelectedRefund(refund);
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = async (status: MarketplaceRefund["status"]) => {
    if (!selectedRefund) return;

    try {
      setProcessingRefund(true);
      const updatedRefund = await updateRefundStatus(selectedRefund.id, status);

      // Update local state
      setRefunds((prev) =>
        prev.map((r) => (r.id === updatedRefund.id ? updatedRefund : r))
      );
      setSelectedRefund(updatedRefund);

      toast({
        title: "Status updated",
        description: `Refund status updated to ${status}.`,
      });

      if (status === "completed" || status === "rejected") {
        setIsDetailOpen(false);
      }
    } catch (error) {
      console.error("Error updating refund status:", error);
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: "Please try again later.",
      });
    } finally {
      setProcessingRefund(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" /> Completed
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <Clock className="w-3 h-3 mr-1" /> Processing
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
          <Badge className="bg-amber-500 hover:bg-amber-600">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center justify-between">
          <span>Refund Management</span>
          <Button
            onClick={fetchRefunds}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Transaction</th>
                <th className="px-6 py-3">Buyer</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {refunds.map((refund) => (
                <tr key={refund.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {refund.transaction?.product_name || "Unknown Product"}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {refund.transaction_id.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {refund.transaction?.buyer?.full_name || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {refund.transaction?.buyer?.email || ""}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${refund.amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(refund.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(refund.created_at), {
                        addSuffix: true,
                        locale: id,
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(refund.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      onClick={() => handleViewDetail(refund)}
                      variant="outline"
                      size="sm"
                      className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                    >
                      <DollarSign className="h-3 w-3 mr-1" /> Process
                    </Button>
                  </td>
                </tr>
              ))}
              {refunds.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No refunds found
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Loading refunds...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Refund Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Process Refund</DialogTitle>
              <DialogDescription>
                Review and process the refund request.
              </DialogDescription>
            </DialogHeader>

            {selectedRefund && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="mb-3">
                    <p className="text-gray-500 text-sm">Product</p>
                    <p className="font-medium">
                      {selectedRefund.transaction?.product_name || "Unknown Product"}
                    </p>
                  </div>
                  <div className="mb-3">
                    <p className="text-gray-500 text-sm">Buyer</p>
                    <p className="font-medium">
                      {selectedRefund.transaction?.buyer?.full_