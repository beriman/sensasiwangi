import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SambatanParticipant } from "@/types/marketplace";
import { Users, Search, CheckCircle, Clock, AlertCircle, User, X } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface SambatanParticipantsListProps {
  participants: SambatanParticipant[];
  initiatorId: string;
  isInitiator: boolean;
}

export default function SambatanParticipantsList({
  participants,
  initiatorId,
  isInitiator,
}: SambatanParticipantsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Filter participants based on search term and active tab
  const filteredParticipants = participants.filter((participant) => {
    const matchesSearch =
      participant.participant?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) || false;

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "verified" && participant.payment_status === "verified") ||
      (activeTab === "pending" && participant.payment_status === "pending") ||
      (activeTab === "cancelled" && participant.payment_status === "cancelled");

    return matchesSearch && matchesTab;
  });

  // Count participants by status
  const verifiedCount = participants.filter(
    (p) => p.payment_status === "verified"
  ).length;
  const pendingCount = participants.filter(
    (p) => p.payment_status === "pending"
  ).length;
  const cancelledCount = participants.filter(
    (p) => p.payment_status === "cancelled"
  ).length;

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return {
          label: "Terverifikasi",
          color: "bg-green-100 text-green-800",
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
        };
      case "pending":
        return {
          label: "Menunggu",
          color: "bg-yellow-100 text-yellow-800",
          icon: <Clock className="h-3 w-3 mr-1" />,
        };
      case "cancelled":
        return {
          label: "Dibatalkan",
          color: "bg-red-100 text-red-800",
          icon: <X className="h-3 w-3 mr-1" />,
        };
      default:
        return {
          label: "Tidak Diketahui",
          color: "bg-gray-100 text-gray-800",
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
        };
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <Users className="h-5 w-5 mr-2 text-purple-600" />
          Peserta Sambatan
          <Badge className="ml-2">{participants.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari peserta..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8 text-gray-400"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Semua <Badge className="ml-1">{participants.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="verified">
                Terverifikasi <Badge className="ml-1">{verifiedCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pending">
                Menunggu <Badge className="ml-1">{pendingCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Dibatalkan <Badge className="ml-1">{cancelledCount}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="pt-4">
              <ParticipantList
                participants={filteredParticipants}
                initiatorId={initiatorId}
                getStatusBadge={getStatusBadge}
                isInitiator={isInitiator}
              />
            </TabsContent>

            <TabsContent value="verified" className="pt-4">
              <ParticipantList
                participants={filteredParticipants}
                initiatorId={initiatorId}
                getStatusBadge={getStatusBadge}
                isInitiator={isInitiator}
              />
            </TabsContent>

            <TabsContent value="pending" className="pt-4">
              <ParticipantList
                participants={filteredParticipants}
                initiatorId={initiatorId}
                getStatusBadge={getStatusBadge}
                isInitiator={isInitiator}
              />
            </TabsContent>

            <TabsContent value="cancelled" className="pt-4">
              <ParticipantList
                participants={filteredParticipants}
                initiatorId={initiatorId}
                getStatusBadge={getStatusBadge}
                isInitiator={isInitiator}
              />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}

interface ParticipantListProps {
  participants: SambatanParticipant[];
  initiatorId: string;
  getStatusBadge: (status: string) => {
    label: string;
    color: string;
    icon: JSX.Element;
  };
  isInitiator: boolean;
}

function ParticipantList({
  participants,
  initiatorId,
  getStatusBadge,
  isInitiator,
}: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">Tidak ada peserta yang ditemukan</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {participants.map((participant) => {
        const isInitiatorBadge = participant.participant_id === initiatorId;
        const statusBadge = getStatusBadge(participant.payment_status);
        const joinedDate = new Date(participant.created_at);

        return (
          <div
            key={participant.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage
                  src={
                    participant.participant?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.participant_id}`
                  }
                  alt={participant.participant?.full_name || ""}
                />
                <AvatarFallback>
                  {participant.participant?.full_name?.[0] || "P"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center">
                  <Link
                    to={`/profile/${participant.participant_id}`}
                    className="font-medium text-gray-900 hover:text-purple-600 hover:underline"
                  >
                    {participant.participant?.full_name || "Peserta"}
                  </Link>
                  {isInitiatorBadge && (
                    <Badge className="ml-2 bg-purple-100 text-purple-800 text-xs">
                      Inisiator
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <span>
                    Bergabung{" "}
                    {formatDistanceToNow(joinedDate, {
                      addSuffix: true,
                      locale: id,
                    })}
                  </span>
                  <span className="mx-2">•</span>
                  <span>Jumlah: {participant.quantity}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Badge className={statusBadge.color}>
                {statusBadge.icon}
                {statusBadge.label}
              </Badge>
              {isInitiator && participant.payment_status === "pending" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                >
                  Verifikasi
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
