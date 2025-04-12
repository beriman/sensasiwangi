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
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

type Transaction = {
  id: string;
  seller_id: string;
  buyer_id: string;
  amount: number;
  status: string;
  created_at: string;
  product_name: string;
  product_description: string;
  seller: { full_name: string; email: string };
  buyer: { full_name: string; email: string };
};

const TransactionsManagement = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
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
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        variant: "destructive",
        title: "Error fetching transactions",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTransactionStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("marketplace_transactions")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setTransactions(
        transactions.map((transaction) =>
          transaction.id === id ? { ...transaction, status } : transaction,
        ),
      );

      toast({
        title: "Transaction updated",
        description: `Transaction status updated to ${status}`,
      });
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({
        variant: "destructive",
        title: "Error updating transaction",
        description: "Please try again later.",
      });
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
          <span>Transaction Management</span>
          <Button
            onClick={fetchTransactions}
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
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Seller</th>
                <th className="px-6 py-3">Buyer</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.product_name}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {transaction.product_description}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.seller?.full_name || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.seller?.email || ""}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.buyer?.full_name || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.buyer?.email || ""}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${transaction.amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(transaction.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() =>
                          updateTransactionStatus(transaction.id, "completed")
                        }
                        variant="outline"
                        size="sm"
                        className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        disabled={transaction.status === "completed"}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() =>
                          updateTransactionStatus(transaction.id, "rejected")
                        }
                        variant="outline"
                        size="sm"
                        className="text-xs bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        disabled={transaction.status === "rejected"}
                      >
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No transactions found
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Loading transactions...
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

export default TransactionsManagement;



