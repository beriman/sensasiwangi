import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import MessagesLayout from "../messages/MessagesLayout";
import { LoadingScreen } from "@/components/ui/loading-spinner";

export default function Messages() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <LoadingScreen text="Loading messages..." />;
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Pesan Pribadi</h1>
      <div className="h-[calc(100vh-12rem)]">
        <MessagesLayout />
      </div>
    </div>
  );
}
