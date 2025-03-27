import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabase/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import {
  getAllDisputes,
  getDisputeMessages,
  addDisputeMessage,
  updateDisputeStatus,
  createRefund,
} from "@/lib/dispute";
import { MarketplaceDispute, DisputeMessage } from "@/types/dispute";

const DisputeManagement = () => {
  const [disputes, setDisputes] = useState<MarketplaceDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] =
    useState<MarketplaceDispute | null>(null);
  const [disputeMessages, setDisputeMessages] = useState<DisputeMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState("");
  const [processingRefund, setProcessingRefund] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const data = await getAllDisputes();
      setDisputes(data);
    } catch (error) {
      console.error("Error fetching disputes:", error);
      toast({
        variant: "destructive",
        title: "Error fetching disputes",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (dispute: MarketplaceDispute) => {
    setSelectedDispute(dispute);
    setAdminNotes(dispute.admin_notes || "");
    setRefundAmount(dispute.transaction?.amount.toString() || "");
    setIsDetailOpen(true);

    try {
      const messages = await getDisputeMessages(dispute.id);
      setDisputeMessages(messages);

      // Set up realtime subscription for messages
      const messagesSubscription = supabase
        .channel(`dispute-messages-${dispute.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "marketplace_dispute_messages",
            filter: `dispute_id=eq.${dispute.id}`,
          },
          async (payload) => {
            // Fetch the complete message with sender info
            const { data } = await supabase
              .from("marketplace_dispute_messages")
              .select(
                `
                *,
                sender:sender_id(full_name, avatar_url)
              `,
              )
              .eq("id", payload.new.id)
              .single();

            if (data) {
              setDisputeMessages((prev) => [...prev, data]);
            }
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesSubscription);
      };
    } catch (error) {
      console.error("Error fetching dispute messages:", error);
      toast({
        variant: "destructive",
        title: "Error fetching messages",
        description: "Please try again later.",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedDispute) return;

    try {
      setSendingMessage(true);
      // Add is_from_admin flag
      await supabase.from("marketplace_dispute_messages").insert({
        dispute_id: selectedDispute.id,
        message: messageText,
        is_from_admin: true,
      });
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        title: "Error sending message",
        description: "Please try again later.",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleUpdateStatus = async (status: MarketplaceDispute["status"]) => {
    if (!selectedDispute) return;

    try {
      setUpdatingStatus(true);
      const updatedDispute = await updateDisputeStatus(
        selectedDispute.id,
        status,
        adminNotes,
      );

      // Update local state
      setDisputes((prev) =>
        prev.map((d) => (d.id === updatedDispute.id ? updatedDispute : d)),
      );
      setSelectedDispute(updatedDispute);

      toast({
        title: "Status updated",
        description: `Dispute status updated to ${status.replace("_", " ")}.`,
      });

      // If resolving in favor of buyer, show refund dialog
      if (status === "resolved_buyer") {
        // Keep dialog open for refund
      } else {
        setIsDetailOpen(false);
      }
    } catch (error) {
      console.error("Error updating dispute status:", error);
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: "Please try again later.",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedDispute || !refundAmount || !refundReason) return;

    try {
      setProcessingRefund(true);
      const refund = await createRefund(
        selectedDispute.transaction_id,
        parseFloat(refundAmount),
        refundReason,
        selectedDispute.id,
      );

      toast({
        title: "Refund processed",
        description: "Refund has been created successfully.",
      });

      // Update dispute status to show it's been processed with refund
      if (selectedDispute.status === "resolved_buyer") {
        await updateDisputeStatus(
          selectedDispute.id,
          "resolved_buyer",
          `Refund processed: ${refundAmount} - ${refundReason}. Refund ID: ${refund.id}`,
        );
      }

      setIsDetailOpen(false);
    } catch (error) {
      console.error("Error processing refund:", error);
      toast({
        variant: "destructive",
        title: "Error processing refund",
        description: "Please try again later.",
      });
    } finally {
      setProcessingRefund(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved_buyer":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" /> Resolved (Buyer)
          </Badge>
        );
      case "resolved_seller":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" /> Resolved (Seller)
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      case "under_review":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <ShieldAlert className="w-3 h-3 mr-1" /> Under Review
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

  const filteredDisputes = disputes.filter((dispute) => {
    if (activeTab === "pending") {
      return dispute.status === "pending" || dispute.status === "under_review";
    } else if (activeTab === "resolved") {
      return (
        dispute.status === "resolved_buyer" ||
        dispute.status === "resolved_seller" ||
        dispute.status === "rejected"
      );
    }
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center justify-between">
          <span>Dispute Management</span>
          <Button
            onClick={fetchDisputes}
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
        <Tabs
          defaultValue="pending"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
            <TabsTrigger value="pending">
              Pending Disputes
              <Badge className="ml-2 bg-amber-500">
                {
                  disputes.filter(
                    (d) =>
                      d.status === "pending" || d.status === "under_review",
                  ).length
                }
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved Disputes
              <Badge className="ml-2 bg-green-500">
                {
                  disputes.filter(
                    (d) =>
                      d.status === "resolved_buyer" ||
                      d.status === "resolved_seller" ||
                      d.status === "rejected",
                  ).length
                }
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Buyer / Seller</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDisputes.map((dispute) => (
                    <tr key={dispute.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {dispute.transaction?.product_name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {dispute.reason.substring(0, 50)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p>
                            <span className="font-medium">Buyer:</span>{" "}
                            {dispute.transaction?.buyer?.full_name}
                          </p>
                          <p>
                            <span className="font-medium">Seller:</span>{" "}
                            {dispute.transaction?.seller?.full_name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${dispute.transaction?.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(dispute.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(dispute.created_at), {
                            addSuffix: true,
                            locale: id,
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(dispute.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => handleViewDetail(dispute)}
                          variant="outline"
                          size="sm"
                          className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        >
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredDisputes.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No disputes found
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        Loading disputes...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="resolved">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Buyer / Seller</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Resolution Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDisputes.map((dispute) => (
                    <tr key={dispute.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {dispute.transaction?.product_name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {dispute.reason.substring(0, 50)}...
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p>
                            <span className="font-medium">Buyer:</span>{" "}
                            {dispute.transaction?.buyer?.full_name}
                          </p>
                          <p>
                            <span className="font-medium">Seller:</span>{" "}
                            {dispute.transaction?.seller?.full_name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${dispute.transaction?.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {dispute.resolved_at
                            ? new Date(dispute.resolved_at).toLocaleDateString()
                            : "N/A"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {dispute.resolved_at
                            ? formatDistanceToNow(
                                new Date(dispute.resolved_at),
                                {
                                  addSuffix: true,
                                  locale: id,
                                },
                              )
                            : ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(dispute.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => handleViewDetail(dispute)}
                          variant="outline"
                          size="sm"
                          className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        >
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredDisputes.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No resolved disputes found
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        Loading disputes...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dispute Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Dispute Details</DialogTitle>
              <DialogDescription>
                Review and manage the dispute for transaction{" "}
                {selectedDispute?.transaction_id}
              </DialogDescription>
            </DialogHeader>

            {selectedDispute && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Transaction Details
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="font-medium text-gray-900 mb-1">
                        {selectedDispute.transaction?.product_name}
                      </p>
                      <p className="text-sm text-gray-600 mb-3">
                        ID: {selectedDispute.transaction_id}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Buyer</p>
                          <p className="font-medium">
                            {selectedDispute.transaction?.buyer?.full_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {selectedDispute.transaction?.buyer?.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Seller</p>
                          <p className="font-medium">
                            {selectedDispute.transaction?.seller?.full_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {selectedDispute.transaction?.seller?.email}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-gray-500">Amount</p>
                        <p className="font-medium">
                          ${selectedDispute.transaction?.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Dispute Information
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="mb-3">
                        <p className="text-gray-500 text-sm">Status</p>
                        <div className="mt-1">
                          {getStatusBadge(selectedDispute.status)}
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-gray-500 text-sm">Initiated by</p>
                        <p className="font-medium">
                          {selectedDispute.initiator?.full_name} (
                          {formatDistanceToNow(
                            new Date(selectedDispute.created_at),
                            {
                              addSuffix: true,
                              locale: id,
                            },
                          )}
                          )
                        </p>
                      </div>
                      <div className="mb-3">
                        <p className="text-gray-500 text-sm">Reason</p>
                        <p className="mt-1 text-gray-900">
                          {selectedDispute.reason}
                        </p>
                      </div>

                      {/* Sambatan Shipping Information (if applicable) */}
                      {selectedDispute.transaction?.sambatan_id && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-gray-500 text-sm font-medium">
                            Sambatan Order
                          </p>
                          <div className="flex items-center mt-1">
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                              Group Purchase
                            </Badge>
                          </div>

                          <p className="text-gray-500 text-sm mt-2">
                            Shipping Optimization
                          </p>
                          <p className="text-sm mt-1">
                            {selectedDispute.transaction
                              ?.used_optimized_shipping ? (
                              <span className="text-green-600">
                                Used optimized shipping rate
                              </span>
                            ) : (
                              <span className="text-amber-600">
                                Used individual shipping rate
                              </span>
                            )}
                          </p>

                          <p className="text-xs text-gray-500 mt-2">
                            Note: Shipping disputes in Sambatan orders may
                            involve group optimization choices. Check if the
                            participant used the recommended shipping option.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Admin Notes
                  </h3>
                  <Textarea
                    placeholder="Add notes about this dispute (visible to admin only)"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="min-h-[100px]"
                    disabled={
                      selectedDispute.status === "resolved_buyer" ||
                      selectedDispute.status === "resolved_seller" ||
                      selectedDispute.status === "rejected"
                    }
                  />
                </div>

                {/* Messages */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Messages
                  </h3>
                  <div className="bg-gray-50 rounded-md p-4 h-[300px] overflow-y-auto flex flex-col space-y-4">
                    {disputeMessages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p>No messages yet.</p>
                      </div>
                    ) : (
                      disputeMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.is_from_admin ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.is_from_admin
                                ? "bg-blue-100 text-blue-900"
                                : message.sender_id ===
                                    selectedDispute.initiator_id
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-gray-200 text-gray-900"
                            }`}
                          >
                            <div className="flex items-center mb-1">
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage
                                  src={
                                    message.sender?.avatar_url ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender_id}`
                                  }
                                  alt={message.sender?.full_name || ""}
                                />
                                <AvatarFallback>
                                  {message.sender?.full_name?.[0] || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium">
                                {message.is_from_admin
                                  ? "Admin"
                                  : message.sender_id ===
                                      selectedDispute.initiator_id
                                    ? `${selectedDispute.initiator?.full_name} (Initiator)`
                                    : message.sender?.full_name || "User"}
                              </span>
                              <span className="text-xs ml-2 text-gray-500">
                                {formatDistanceToNow(
                                  new Date(message.created_at),
                                  {
                                    addSuffix: true,
                                    locale: id,
                                  },
                                )}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-line">
                              {message.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {selectedDispute.status !== "resolved_buyer" &&
                    selectedDispute.status !== "resolved_seller" &&
                    selectedDispute.status !== "rejected" && (
                      <div className="mt-3 flex">
                        <Textarea
                          placeholder="Type your message here..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          className="flex-1 resize-none"
                          disabled={sendingMessage}
                        />
                        <Button
                          className="ml-2 bg-blue-600 hover:bg-blue-700"
                          onClick={handleSendMessage}
                          disabled={!messageText.trim() || sendingMessage}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                </div>

                {/* Refund Form (only shown when resolving in favor of buyer) */}
                {selectedDispute.status === "resolved_buyer" && (
                  <div className="border border-amber-200 bg-amber-50 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-amber-800 mb-2">
                      Process Refund
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-amber-800">
                          Refund Amount
                        </label>
                        <input
                          type="number"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          className="w-full mt-1 p-2 border border-amber-300 rounded-md"
                          placeholder="Enter refund amount"
                          min="0"
                          max={selectedDispute.transaction?.amount}
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-amber-800">
                          Refund Reason
                        </label>
                        <Textarea
                          placeholder="Provide reason for the refund"
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          className="min-h-[80px] border-amber-300"
                        />
                      </div>
                      <Button
                        onClick={handleProcessRefund}
                        disabled={
                          processingRefund ||
                          !refundAmount ||
                          !refundReason ||
                          parseFloat(refundAmount) <= 0
                        }
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        {processingRefund ? "Processing..." : "Process Refund"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedDispute.status === "pending" && (
                  <div className="flex flex-col sm:flex-row gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus("under_review")}
                      disabled={updatingStatus}
                      className="border-blue-500 text-blue-500 hover:bg-blue-50"
                    >
                      <ShieldAlert className="h-4 w-4 mr-1" />
                      Mark as Under Review
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus("rejected")}
                      disabled={updatingStatus}
                      className="border-red-500 text-red-500 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject Dispute
                    </Button>
                  </div>
                )}

                {selectedDispute.status === "under_review" && (
                  <div className="flex flex-col sm:flex-row gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus("resolved_seller")}
                      disabled={updatingStatus}
                      className="border-green-500 text-green-500 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolve in Favor of Seller
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus("resolved_buyer")}
                      disabled={updatingStatus}
                      className="border-amber-500 text-amber-500 hover:bg-amber-50"
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Resolve in Favor of Buyer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus("rejected")}
                      disabled={updatingStatus}
                      className="border-red-500 text-red-500 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject Dispute
                    </Button>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDetailOpen(false)}
                disabled={updatingStatus || processingRefund}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DisputeManagement;
