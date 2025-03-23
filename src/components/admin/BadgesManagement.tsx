import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabase/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Award, Trash2, Plus } from "lucide-react";

type UserBadge = {
  id: string;
  user_id: string;
  badge_name: string;
  badge_description: string;
  awarded_at: string;
  user: {
    full_name: string;
    email: string;
  };
};

type User = {
  id: string;
  full_name: string;
  email: string;
};

const BadgesManagement = () => {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBadge, setNewBadge] = useState({
    userId: "",
    badgeName: "",
    badgeDescription: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchBadges();
    fetchUsers();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_badges")
        .select(`*, user:user_id(id, full_name, email)`)
        .order("awarded_at", { ascending: false });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error("Error fetching badges:", error);
      toast({
        variant: "destructive",
        title: "Error fetching badges",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const addBadge = async () => {
    try {
      if (!newBadge.userId || !newBadge.badgeName) {
        toast({
          variant: "destructive",
          title: "Missing information",
          description: "Please select a user and enter a badge name.",
        });
        return;
      }

      const { error } = await supabase.from("user_badges").insert({
        user_id: newBadge.userId,
        badge_name: newBadge.badgeName,
        badge_description: newBadge.badgeDescription,
      });

      if (error) throw error;

      toast({
        title: "Badge added",
        description: "Badge has been successfully awarded.",
      });

      // Reset form and close dialog
      setNewBadge({ userId: "", badgeName: "", badgeDescription: "" });
      setIsDialogOpen(false);
      fetchBadges();
    } catch (error) {
      console.error("Error adding badge:", error);
      toast({
        variant: "destructive",
        title: "Error adding badge",
        description: "Please try again later.",
      });
    }
  };

  const removeBadge = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_badges")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setBadges(badges.filter((badge) => badge.id !== id));

      toast({
        title: "Badge removed",
        description: "Badge has been successfully removed.",
      });
    } catch (error) {
      console.error("Error removing badge:", error);
      toast({
        variant: "destructive",
        title: "Error removing badge",
        description: "Please try again later.",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center justify-between">
            <span>Badge Management</span>
            <div className="flex space-x-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Award Badge
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Award New Badge</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="user">Select User</Label>
                      <select
                        id="user"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={newBadge.userId}
                        onChange={(e) =>
                          setNewBadge({ ...newBadge, userId: e.target.value })
                        }
                      >
                        <option value="">Select a user</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.full_name || user.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="badgeName">Badge Name</Label>
                      <Input
                        id="badgeName"
                        value={newBadge.badgeName}
                        onChange={(e) =>
                          setNewBadge({
                            ...newBadge,
                            badgeName: e.target.value,
                          })
                        }
                        placeholder="e.g. Top Contributor"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="badgeDescription">
                        Description (Optional)
                      </Label>
                      <Input
                        id="badgeDescription"
                        value={newBadge.badgeDescription}
                        onChange={(e) =>
                          setNewBadge({
                            ...newBadge,
                            badgeDescription: e.target.value,
                          })
                        }
                        placeholder="e.g. Awarded for exceptional contributions"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={addBadge}>Award Badge</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                onClick={fetchBadges}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Badge</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Awarded Date</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {badges.map((badge) => (
                  <tr key={badge.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Award className="h-5 w-5 text-yellow-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {badge.badge_name}
                          </div>
                          {badge.badge_description && (
                            <div className="text-sm text-gray-500">
                              {badge.badge_description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {badge.user?.full_name || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {badge.user?.email || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(badge.awarded_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        onClick={() => removeBadge(badge.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {badges.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No badges found
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      Loading badges...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default BadgesManagement;
