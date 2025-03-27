import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabase/supabase";
import { Sambatan, SambatanParticipant } from "@/types/marketplace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LoadingScreen } from "../ui/loading-spinner";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Users,
  ShoppingBag,
} from "lucide-react";

const SambatanManagement = () => {
  const [sambatans, setSambatans] = useState<Sambatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedSambatan, setSelectedSambatan] = useState<Sambatan | null>(
    null,
  );
  const [participants, setParticipants] = useState<SambatanParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  useEffect(() => {
    fetchSambatans();

    // Set up real-time subscription
    const sambatanSubscription = supabase
      .channel("sambatan-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sambatan",
        },
        () => {
          fetchSambatans();
        },
      )
      .subscribe();

    const participantsSubscription = supabase
      .channel("sambatan-participants-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sambatan_participants",
        },
        () => {
          if (selectedSambatan) {
            fetchParticipants(selectedSambatan.id);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sambatanSubscription);
      supabase.removeChannel(participantsSubscription);
    };
  }, [selectedSambatan]);

  const fetchSambatans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sambatan")
        .select(
          `
          *,
          initiator:initiator_id(id, full_name, avatar_url),
          product:product_id(*,
            seller:seller_id(id, full_name, avatar_url)
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSambatans(data || []);
    } catch (error) {
      console.error("Error fetching sambatans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (sambatanId: string) => {
    setLoadingParticipants(true);
    try {
      const { data, error } = await supabase
        .from("sambatan_participants")
        .select(
          `
          *,
          participant:participant_id(id, full_name, avatar_url)
        `,
        )
        .eq("sambatan_id", sambatanId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleSambatanSelect = (sambatan: Sambatan) => {
    setSelectedSambatan(sambatan);
    fetchParticipants(sambatan.id);
  };

  const verifyPayment = async (
    sambatanId: string,
    participantId: string,
    isVerified: boolean,
  ) => {
    try {
      const status = isVerified ? "verified" : "cancelled";

      // Update payment status
      const { error } = await supabase
        .from("sambatan_participants")
        .update({
          payment_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("sambatan_id", sambatanId)
        .eq("participant_id", participantId);

      if (error) throw error;

      // If payment is verified, check if all participants have verified payments
      if (isVerified) {
        await checkAndUpdateSambatanStatus(sambatanId);
      }

      // Refresh participants list
      fetchParticipants(sambatanId);
    } catch (error) {
      console.error("Error verifying payment:", error);
    }
  };

  const checkAndUpdateSambatanStatus = async (sambatanId: string) => {
    try {
      // Get sambatan details
      const { data: sambatan, error: sambatanError } = await supabase
        .from("sambatan")
        .select("*")
        .eq("id", sambatanId)
        .single();

      if (sambatanError) throw sambatanError;

      // Get all participants
      const { data: participants, error: participantsError } = await supabase
        .from("sambatan_participants")
        .select("*")
        .eq("sambatan_id", sambatanId);

      if (participantsError) throw participantsError;

      // Check if all participants have verified payments
      const allVerified = participants.every(
        (p) => p.payment_status === "verified",
      );

      // If sambatan is closed and all payments verified, mark as completed
      if (allVerified && sambatan.status === "closed") {
        const { error: updateError } = await supabase
          .from("sambatan")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", sambatanId);

        if (updateError) throw updateError;
      }

      // Refresh sambatans list
      fetchSambatans();
    } catch (error) {
      console.error("Error updating sambatan status:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-500">Open</Badge>;
      case "closed":
        return <Badge className="bg-yellow-500">Closed</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      case "verified":
        return (
          <Badge className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Verified
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Cancelled
          </Badge>
        );
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const filteredSambatans = sambatans.filter((sambatan) => {
    if (activeTab === "all") return true;
    return sambatan.status === activeTab;
  });

  if (loading) {
    return <LoadingScreen text="Loading sambatan data..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sambatan Management</h2>
          <p className="text-muted-foreground">
            Manage group buying activities and verify payments
          </p>
        </div>
        <Button onClick={fetchSambatans}>Refresh Data</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-[400px]">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Sambatan List
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSambatans.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No sambatan found
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSambatans.map((sambatan) => (
                    <div
                      key={sambatan.id}
                      className={`p-3 rounded-md cursor-pointer hover:bg-accent transition-colors ${selectedSambatan?.id === sambatan.id ? "bg-accent" : "bg-card"}`}
                      onClick={() => handleSambatanSelect(sambatan)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={sambatan.initiator?.avatar_url || ""}
                              alt={sambatan.initiator?.full_name || "User"}
                            />
                            <AvatarFallback>
                              {sambatan.initiator?.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium truncate w-40">
                              {sambatan.product?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(
                                sambatan.created_at,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(sambatan.status)}
                          <span className="text-xs">
                            {sambatan.current_quantity}/
                            {sambatan.target_quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedSambatan ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Sambatan Details</span>
                  {getStatusBadge(selectedSambatan.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Product
                      </h3>
                      <p className="font-medium">
                        {selectedSambatan.product?.name}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Price
                      </h3>
                      <p className="font-medium">
                        Rp {selectedSambatan.product?.price.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Initiator
                      </h3>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={selectedSambatan.initiator?.avatar_url || ""}
                            alt={
                              selectedSambatan.initiator?.full_name || "User"
                            }
                          />
                          <AvatarFallback>
                            {selectedSambatan.initiator?.full_name?.charAt(0) ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span>{selectedSambatan.initiator?.full_name}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Seller
                      </h3>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={
                              selectedSambatan.product?.seller?.avatar_url || ""
                            }
                            alt={
                              selectedSambatan.product?.seller?.full_name ||
                              "Seller"
                            }
                          />
                          <AvatarFallback>
                            {selectedSambatan.product?.seller?.full_name?.charAt(
                              0,
                            ) || "S"}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {selectedSambatan.product?.seller?.full_name}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Created
                      </h3>
                      <p>
                        {new Date(selectedSambatan.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Progress
                      </h3>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>
                          {selectedSambatan.current_quantity}/
                          {selectedSambatan.target_quantity} participants
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Participants
                    </h3>

                    {loadingParticipants ? (
                      <div className="text-center py-4">
                        <LoadingScreen text="Loading participants..." />
                      </div>
                    ) : participants.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No participants found
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {participants.map((participant) => (
                          <div
                            key={participant.id}
                            className="bg-accent/50 p-4 rounded-md"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage
                                    src={
                                      participant.participant?.avatar_url || ""
                                    }
                                    alt={
                                      participant.participant?.full_name ||
                                      "User"
                                    }
                                  />
                                  <AvatarFallback>
                                    {participant.participant?.full_name?.charAt(
                                      0,
                                    ) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {participant.participant?.full_name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Quantity: {participant.quantity} • Joined:{" "}
                                    {new Date(
                                      participant.created_at,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {getPaymentStatusBadge(
                                  participant.payment_status,
                                )}

                                {participant.payment_status === "pending" && (
                                  <div className="flex gap-2">
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-green-600 border-green-600 hover:bg-green-100"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" />{" "}
                                          Verify
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Verify Payment
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to verify this
                                            payment? This will confirm that the
                                            payment has been received.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              verifyPayment(
                                                selectedSambatan.id,
                                                participant.participant_id,
                                                true,
                                              )
                                            }
                                          >
                                            Verify
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>

                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-red-600 border-red-600 hover:bg-red-100"
                                        >
                                          <XCircle className="h-4 w-4 mr-1" />{" "}
                                          Reject
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Reject Payment
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to reject this
                                            payment? This will mark the payment
                                            as cancelled.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              verifyPayment(
                                                selectedSambatan.id,
                                                participant.participant_id,
                                                false,
                                              )
                                            }
                                          >
                                            Reject
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                )}

                                {participant.payment_proof && (
                                  <Button
                                    size="sm"
                                    variant="link"
                                    onClick={() =>
                                      window.open(
                                        participant.payment_proof,
                                        "_blank",
                                      )
                                    }
                                  >
                                    View Payment Proof
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedSambatan.status === "closed" &&
                    participants.every(
                      (p) => p.payment_status === "verified",
                    ) && (
                      <div className="mt-6">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button className="w-full">
                              <CheckCircle className="h-4 w-4 mr-2" /> Mark as
                              Completed & Release Funds
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Complete Sambatan
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to mark this Sambatan as
                                completed? This will release funds to the
                                seller.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  checkAndUpdateSambatanStatus(
                                    selectedSambatan.id,
                                  )
                                }
                              >
                                Complete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Sambatan Selected</h3>
                <p className="text-muted-foreground text-center mt-2">
                  Select a sambatan from the list to view details and manage
                  participants
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SambatanManagement;
