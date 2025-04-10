import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-provider";
import { supabase } from "@/lib/supabase";
import { LoadingScreen } from "@/components/ui/loading-spinner";

interface BusinessRouteProps {
  children: React.ReactNode;
}

export default function BusinessRoute({ children }: BusinessRouteProps) {
  const { user, loading } = useAuth();
  const [isBusiness, setIsBusiness] = useState<boolean | null>(null);
  const [isCheckingMembership, setIsCheckingMembership] = useState(true);

  useEffect(() => {
    const checkMembership = async () => {
      if (!user) {
        setIsCheckingMembership(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("membership")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setIsBusiness(data?.membership === "business");
      } catch (error) {
        console.error("Error checking membership:", error);
        setIsBusiness(false);
      } finally {
        setIsCheckingMembership(false);
      }
    };

    checkMembership();
  }, [user]);

  if (loading || isCheckingMembership) {
    return <LoadingScreen text="Memeriksa akses..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isBusiness) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}
