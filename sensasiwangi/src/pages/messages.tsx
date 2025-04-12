import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MessagesLayout from "../components/messages/MessagesLayout";
import { ConversationProvider } from "@/contexts/ConversationContext";
import { useAuth } from "../../supabase/auth";

export default function MessagesPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login?redirect=/messages" replace />;
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Pesan Pribadi</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-12rem)]">
        <ConversationProvider>
          <Routes>
            <Route path="/" element={<MessagesLayout />} />
            <Route path="/:conversationId" element={<MessagesLayout />} />
          </Routes>
        </ConversationProvider>
      </div>
    </div>
  );
}

