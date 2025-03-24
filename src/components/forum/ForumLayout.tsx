import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Droplet } from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import NotificationCenter from "./NotificationCenter";

interface ForumLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function ForumLayout({
  children,
  title,
  subtitle,
}: ForumLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full bg-[rgba(255,255,255,0.8)] backdrop-blur-md border-b border-[#f5f5f7]/30">
        <div className="max-w-[1200px] mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <Link to="/" className="font-medium text-xl flex items-center">
              <Droplet className="h-6 w-6 mr-2 text-purple-600" />
              <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent font-bold">
                Sensasiwangi
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/forum"
              className="text-sm font-medium hover:text-purple-600"
            >
              Forum
            </Link>
            <Link
              to="/dashboard"
              className="text-sm font-medium hover:text-purple-600"
            >
              Dashboard
            </Link>
            {user && <NotificationCenter />}
            {!user && (
              <Link to="/login">
                <button className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90 text-sm px-4 py-2">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-[1200px] mx-auto">
          {(title || subtitle) && (
            <div className="mb-8 text-center">
              {title && (
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              )}
              {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-6 border-t border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2024 Sensasiwangi. Forum Komunitas Perfumer Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}
