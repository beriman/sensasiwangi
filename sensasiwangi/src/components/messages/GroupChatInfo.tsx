// @ts-ignore
import React, { useState, useEffect } from "react";
// @ts-ignore
import { supabase } from "../../lib/supabase";
// @ts-ignore
import { useAuth } from "../../lib/auth-provider";
// @ts-ignore
import { ConversationParticipant } from "../../types/messages";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Input } from "../../components/ui/input";
// @ts-ignore
import { Separator } from "../../components/ui/separator";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet";
import {
  Users,
  UserPlus,
  Search,
  X,
  LogOut,
  Settings,
  Trash2,
  Edit,
  Check,
} from "lucide-react";
// @ts-ignore
import OnlineStatusIndicator from "./OnlineStatusIndicator";

interface GroupChatInfoProps {
  conversationId: string;
  title: string;
  participants: ConversationParticipant[];
  isCreator: boolean;
  onUpdateTitle: (newTitle: string) => void;
  onLeaveGroup: () => void;
  onAddParticipants: (newParticipants: any[]) => void;
}

export default function GroupChatInfo({
  conversationId,
  title,
  participants,
  isCreator,
  onUpdateTitle,
  onLeaveGroup,
  onAddParticipants,
}: GroupChatInfoProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingUsers, setIsAddingUsers] = useState(false);

  // Reset title when conversation changes
  useEffect(() => {
    setNewTitle(title);
  }, [title]);

  const handleSaveTitle = () => {
    if (newTitle.trim() && newTitle !== title) {
      onUpdateTitle(newTitle);
    }
    setIsEditing(false);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      // Get existing participant IDs to exclude them
      const existingParticipantIds = participants.map((p) => p.user_id);

      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, avatar_url")
        .ilike("full_name", `%${searchTerm}%`)
        .not("id", "in", `(${existingParticipantIds.join(",")})`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Error",
        description: "Gagal mencari pengguna. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const toggleSelectUser = (user: any) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleAddParticipants = async () => {
    if (selectedUsers.length === 0) return;

    setIsAddingUsers(true);
    try {
      await onAddParticipants(selectedUsers);
      setSelectedUsers([]);
      setSearchResults([]);
      setSearchTerm("");
      toast({
        title: "Berhasil",
        description: `${selectedUsers.length} peserta baru telah ditambahkan ke grup.`,
      });
    } catch (error) {
      console.error("Error adding participants:", error);
      toast({
        title: "Error",
        description: "Gagal menambahkan peserta. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsAddingUsers(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Users className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Informasi Grup</SheetTitle>
        </SheetHeader>
        <div className="py-4">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="mb-6">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="flex-1"
                  placeholder="Nama grup"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSaveTitle}
                  className="h-8 w-8"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsEditing(false);
                    setNewTitle(title);
                  }}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-center">{title}</h3>
                {isCreator && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            <p className="text-sm text-gray-500 text-center mt-1">
              {participants.length} peserta
            </p>
          </div>

          <Separator className="my-4" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Peserta</h4>
              {isCreator && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Tambah
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Tambah Peserta</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Cari pengguna..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="pl-9"
                          />
                        </div>
                        <Button
                          onClick={handleSearch}
                          disabled={isSearching || !searchTerm.trim()}
                        >
                          {isSearching ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            "Cari"
                          )}
                        </Button>
                      </div>

                      {searchResults.length > 0 && (
                        <div className="border rounded-md overflow-hidden">
                          <div className="max-h-[200px] overflow-y-auto">
                            {searchResults.map((result) => (
                              <div
                                key={result.id}
                                className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer ${
                                  selectedUsers.some((u) => u.id === result.id)
                                    ? "bg-purple-50"
                                    : ""
                                }`}
                                onClick={() => toggleSelectUser(result)}
                              >
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-3">
                                    <AvatarImage
                                      src={
                                        result.avatar_url ||
                                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.id}`
                                      }
                                      alt={result.full_name || ""}
                                    />
                                    <AvatarFallback>
                                      {result.full_name?.[0] || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">
                                    {result.full_name}
                                  </span>
                                </div>
                                {selectedUsers.some(
                                  (u) => u.id === result.id
                                ) && (
                                  <Check className="h-4 w-4 text-purple-600" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedUsers.length > 0 && (
                        <div className="pt-2">
                          <p className="text-sm font-medium mb-2">
                            Pengguna terpilih ({selectedUsers.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedUsers.map((selectedUser) => (
                              <Badge
                                key={selectedUser.id}
                                variant="secondary"
                                className="flex items-center gap-1 pl-1 pr-2 py-1"
                              >
                                <Avatar className="h-5 w-5">
                                  <AvatarImage
                                    src={
                                      selectedUser.avatar_url ||
                                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.id}`
                                    }
                                    alt={selectedUser.full_name || ""}
                                  />
                                  <AvatarFallback className="text-[8px]">
                                    {selectedUser.full_name?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs">
                                  {selectedUser.full_name}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 p-0 ml-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelectUser(selectedUser);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button
                          onClick={handleAddParticipants}
                          disabled={
                            selectedUsers.length === 0 || isAddingUsers
                          }
                        >
                          {isAddingUsers ? (
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            <UserPlus className="h-4 w-4 mr-2" />
                          )}
                          Tambahkan
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <div className="relative">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarImage
                          src={
                            participant.user?.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.user_id}`
                          }
                          alt={participant.user?.full_name || ""}
                        />
                        <AvatarFallback>
                          {participant.user?.full_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <OnlineStatusIndicator
                        userId={participant.user_id}
                        className="absolute bottom-0 right-2"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {participant.user?.full_name || "Pengguna"}
                        {participant.user_id === user?.id && " (Anda)"}
                      </p>
                      {participant.is_admin && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 h-4"
                        >
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={onLeaveGroup}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Keluar dari Grup
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}


