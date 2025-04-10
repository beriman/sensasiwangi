import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-provider";
import MessagesLayout from "../messages/MessagesLayout";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import MainLayout from "../layout/MainLayout";
import { ConversationProvider } from "@/contexts/ConversationContext";

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
    <MainLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Pesan Pribadi</h1>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-12rem)]">
          <ConversationProvider>
            <MessagesLayout />
          </ConversationProvider>
        </div>
      </div>
    </MainLayout>
  );
}
