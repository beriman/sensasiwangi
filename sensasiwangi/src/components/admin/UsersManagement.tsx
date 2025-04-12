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
import { Tables } from "../../types/supabase";
// @ts-ignore
import { UserCheck, UserX, Shield, ShoppingBag, User } from "lucide-react";

type UserWithRole = Tables<"users"> & { role: string };

const UsersManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error fetching users",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ role })
        .eq("id", userId);

      if (error) throw error;

      // Update local state
      setUsers(
        users.map((user) => (user.id === userId ? { ...user, role } : user)),
      );

      toast({
        title: "Role updated",
        description: `User role updated to ${role}`,
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        variant: "destructive",
        title: "Error updating role",
        description: "Please try again later.",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <Shield className="w-3 h-3 mr-1" /> Admin
          </Badge>
        );
      case "seller":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <ShoppingBag className="w-3 h-3 mr-1" /> Seller
          </Badge>
        );
      default:
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <User className="w-3 h-3 mr-1" /> User
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center justify-between">
          <span>User Management</span>
          <Button
            onClick={fetchUsers}
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
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Level</th>
                <th className="px-6 py-3">EXP</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full"
                          src={
                            user.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                          }
                          alt=""
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || "No Name"}
                        </div>
                        <div className="text-sm text-gray-500">
                          Joined{" "}
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.level || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.exp_points || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role || "user")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => updateUserRole(user.id, "admin")}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        disabled={user.role === "admin"}
                      >
                        Make Admin
                      </Button>
                      <Button
                        onClick={() => updateUserRole(user.id, "seller")}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        disabled={user.role === "seller"}
                      >
                        Make Seller
                      </Button>
                      <Button
                        onClick={() => updateUserRole(user.id, "user")}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        disabled={user.role === "user"}
                      >
                        Make User
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Loading users...
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

export default UsersManagement;



