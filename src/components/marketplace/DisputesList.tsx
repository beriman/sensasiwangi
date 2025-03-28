import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getUserDisputes, getSellerDisputes } from "@/lib/dispute";
import { MarketplaceDispute } from "@/types/dispute";

const DisputesList = () => {
  const [buyerDisputes, setBuyerDisputes] = useState<MarketplaceDispute[]>([]);
  const [sellerDisputes, setSellerDisputes] = useState<MarketplaceDispute[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("buyer");
  const { toast } = useToast();

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        setLoading(true);
        const [buyerData, sellerData] = await Promise.all([
          getUserDisputes(),
          getSellerDisputes(),
        ]);
        setBuyerDisputes(buyerData);
        setSellerDisputes(sellerData);
      } catch (error) {
        console.error("Error fetching disputes:", error);
        toast({
          title: "Error",
          description: "Gagal memuat daftar sengketa. Silakan coba lagi.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDisputes();
  }, [toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved_buyer":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" /> Selesai (Pembeli)
          </Badge>
        );
      case "resolved_seller":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-3 h-3 mr-1" /> Selesai (Penjual)
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <XCircle className="w-3 h-3 mr-1" /> Ditolak
          </Badge>
        );
      case "under_review":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <ShieldAlert className="w-3 h-3 mr-1" /> Dalam Peninjauan
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600">
            <Clock className="w-3 h-3 mr-1" /> Menunggu
          </Badge>
        );
    }
  };

  const renderDisputesList = (disputes: MarketplaceDispute[]) => {
    if (disputes.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Tidak ada sengketa yang ditemukan.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {disputes.map((dispute) => (
          <Card
            key={dispute.id}
            className="bg-white border border-gray-100 hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    {getStatusBadge(dispute.status)}
                    <span className="ml-2 text-sm text-gray-500">
                      {formatDistanceToNow(new Date(dispute.created_at), {
                        addSuffix: true,
                        locale: id,
                      })}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {dispute.transaction?.product_name}
                  </h3>
                  <div className="text-sm text-gray-500 mb-3">
                    <p>
                      {activeTab === "buyer"
                        ? `Penjual: ${dispute.transaction?.seller?.full_name}`
                        : `Pembeli: ${dispute.transaction?.buyer?.full_name}`}
                    </p>
                    <p>
                      Jumlah: Rp
                      {dispute.transaction?.amount.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-500">Alasan:</p>
                    <p className="text-gray-700 line-clamp-2">
                      {dispute.reason}
                    </p>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 md:ml-4">
                  <Link to={`/marketplace/disputes/${dispute.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-purple-500 text-purple-500 hover:bg-purple-50"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Lihat Detail
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-white border border-gray-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold">Daftar Sengketa</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="buyer"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="buyer">Sebagai Pembeli</TabsTrigger>
            <TabsTrigger value="seller">Sebagai Penjual</TabsTrigger>
          </TabsList>
          <TabsContent value="buyer">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner text="Memuat sengketa..." />
              </div>
            ) : (
              renderDisputesList(buyerDisputes)
            )}
          </TabsContent>
          <TabsContent value="seller">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner text="Memuat sengketa..." />
              </div>
            ) : (
              renderDisputesList(sellerDisputes)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DisputesList;
