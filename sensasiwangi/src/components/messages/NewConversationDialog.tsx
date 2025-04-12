// @ts-ignore
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Input } from "../../components/ui/input";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
// @ts-ignore
import { Search, Loader2 } from "lucide-react";
// @ts-ignore
import { supabase } from "../../../supabase/supabase";
// @ts-ignore
import { useAuth } from "../../../supabase/auth";

interface User {
  id: string;
  full_name?: string;
  avatar_url?: string;
  username?: string;
}

interface NewConversationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateConversation: (userId: string) => void;
}

export default function NewConversationDialog({
  isOpen,
  onClose,
  onCreateConversation,
}: NewConversationDialogProps) {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (isOpen && searchTerm.length >= 2) {
      searchUsers(searchTerm);
    }
  }, [searchTerm, isOpen]);

  const searchUsers = async (term: string) => {
    if (term.length < 2) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, avatar_url, username")
        .or(
          `full_name.ilike.%${term}%,username.ilike.%${term}%,email.ilike.%${term}%`,
        )
        .neq("id", currentUser?.id || "")
        .limit(10);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConversation = () => {
    if (selectedUser) {
      onCreateConversation(selectedUser.id);
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setUsers([]);
    setSelectedUser(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Percakapan Baru</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari pengguna..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : users.length === 0 && searchTerm.length >= 2 ? (
              <p className="text-center text-sm text-gray-500 py-4">
                Tidak ada pengguna yang ditemukan
              </p>
            ) : (
              users.map((user) => (
                <Button
                  key={user.id}
                  variant="ghost"
                  className="w-full justify-start px-2 py-6 h-auto"
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center w-full">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage
                        src={
                          user.avatar_url ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                        }
                        alt={user.full_name || "User"}
                      />
                      <AvatarFallback>
                        {user.full_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <h3 className="font-medium text-gray-900">
                        {user.full_name || user.username || "User"}
                      </h3>
                      <p className="text-sm text-gray-500">{user.username}</p>
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>

          {selectedUser && (
            <div className="mt-4 p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage
                    src={
                      selectedUser.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.id}`
                    }
                    alt={selectedUser.full_name || "User"}
                  />
                  <AvatarFallback>
                    {selectedUser.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">
                    {selectedUser.full_name || selectedUser.username || "User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedUser.username}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={handleReset}>
            Reset
          </Button>
          <Button
            onClick={handleCreateConversation}
            disabled={!selectedUser}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Mulai Percakapan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


