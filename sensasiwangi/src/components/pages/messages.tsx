// @ts-ignore
import React, { useEffect } from "react";
// @ts-ignore
import { useNavigate } from "react-router-dom";
// @ts-ignore
import { useAuth } from "../../lib/auth-provider";
// @ts-ignore
import MessagesLayout from "../messages/MessagesLayout";
// @ts-ignore
import { LoadingScreen } from "../../components/ui/loading-spinner";
// @ts-ignore
import MainLayout from "../layout/MainLayout";
// @ts-ignore
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


