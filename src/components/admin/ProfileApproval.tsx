import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldX, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";
import { formatDistanceToNow } from "date-fns";

interface ProfileApprovalProps {
  userId: string;
  onStatusChange?: (isApproved: boolean) => void;
}

interface ApprovalStatus {
  isApproved: boolean;
  approvalDate?: string;
  approvedBy?: {
    full_name?: string;
    username?: string;
  };
}

export default function ProfileApproval({
  userId,
  onStatusChange,
}: ProfileApprovalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<ApprovalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchApprovalStatus = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("users")
          .select(
            "is_approved, approval_date, approver:approved_by(full_name, username)",
          )
          .eq("id", userId)
          .single();

        if (error) throw error;

        setStatus({
          isApproved: data.is_approved || false,
          approvalDate: data.approval_date,
          approvedBy: data.approver,
        });
      } catch (error) {
        console.error("Error fetching approval status:", error);
        toast({
          title: "Error",
          description: "Failed to load approval status",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApprovalStatus();
  }, [user, userId, toast]);

  const handleApprove = async () => {
    if (!user) return;

    try {
      setUpdating(true);
      const { error } = await supabase
        .from("users")
        .update({
          is_approved: true,
          approval_date: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq("id", userId);

      if (error) throw error;

      // Get approver name
      const { data: approverData } = await supabase
        .from("users")
        .select("full_name, username")
        .eq("id", user.id)
        .single();

      setStatus({
        isApproved: true,
        approvalDate: new Date().toISOString(),
        approvedBy: approverData || undefined,
      });

      toast({
        title: "Profile Approved",
        description: "User profile has been approved successfully",
      });

      if (onStatusChange) {
        onStatusChange(true);
      }
    } catch (error) {
      console.error("Error approving profile:", error);
      toast({
        title: "Error",
        description: "Failed to approve profile",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRevoke = async () => {
    if (
      !user ||
      !window.confirm(
        "Are you sure you want to revoke approval for this profile?",
      )
    )
      return;

    try {
      setUpdating(true);
      const { error } = await supabase
        .from("users")
        .update({
          is_approved: false,
          approval_date: null,
          approved_by: null,
        })
        .eq("id", userId);

      if (error) throw error;

      setStatus({
        isApproved: false,
        approvalDate: undefined,
        approvedBy: undefined,
      });

      toast({
        title: "Approval Revoked",
        description: "User profile approval has been revoked",
      });

      if (onStatusChange) {
        onStatusChange(false);
      }
    } catch (error) {
      console.error("Error revoking approval:", error);
      toast({
        title: "Error",
        description: "Failed to revoke approval",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShieldCheck className="h-5 w-5 mr-2 text-blue-500" />
          Profile Verification
        </CardTitle>
        <CardDescription>
          Verify this user's profile to grant them additional privileges
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="font-medium mr-2">Status:</span>
                {status?.isApproved ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500">
                    <Clock className="h-3 w-3 mr-1" /> Pending Verification
                  </Badge>
                )}
              </div>

              {status?.isApproved ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRevoke}
                  disabled={updating}
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <ShieldX className="h-4 w-4 mr-1" />
                  )}
                  Revoke
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleApprove}
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updating ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 mr-1" />
                  )}
                  Verify
                </Button>
              )}
            </div>

            {status?.isApproved && status.approvalDate && (
              <div className="text-sm text-gray-500">
                <p>
                  Verified{" "}
                  {formatDistanceToNow(new Date(status.approvalDate), {
                    addSuffix: true,
                  })}
                  {status.approvedBy && (
                    <>
                      {" "}
                      by{" "}
                      {status.approvedBy.full_name ||
                        status.approvedBy.username ||
                        "Admin"}
                    </>
                  )}
                </p>
              </div>
            )}

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              <p className="font-medium mb-1">Verification Benefits:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Verified badge on profile</li>
                <li>Higher visibility in marketplace listings</li>
                <li>Access to exclusive community features</li>
                <li>Increased trust from other community members</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
