// Switched from Google OAuth to Clerk for authentication - Implementation
import { Suspense } from "react";
import { Navigate, Route, Routes, useRoutes } from "react-router-dom";
import routes from "tempo-routes";
import ClerkAuth from "./components/auth/ClerkAuth";
import Dashboard from "./components/pages/dashboard";
import Success from "./components/pages/success";
import AuthCallback from "./components/pages/auth-callback";
import Home from "./components/pages/home";
import Forum from "./components/pages/forum";
import Marketplace from "./components/pages/marketplace";
import MarketplaceHome from "./components/marketplace/MarketplaceHome";
import MyShop from "./components/marketplace/MyShop";
import ProductDetail from "./components/marketplace/ProductDetail";
import ProductForm from "./components/marketplace/ProductForm";
import WishlistPage from "./components/marketplace/WishlistPage";
import SambatanList from "./components/marketplace/SambatanList";
import SambatanPage from "./components/marketplace/SambatanPage";
import CreateSambatan from "./components/marketplace/CreateSambatan";
import AdminPanel from "./components/pages/admin";
import Profile from "./components/pages/profile";
import Settings from "./components/pages/settings";
import Messages from "./components/pages/messages";
import Notifications from "./components/pages/NotificationsPage";
import SharedAchievement from "./components/pages/SharedAchievement";
import { AuthProvider, useAuth } from "./lib/auth-provider";
import { ClerkProvider } from "./lib/clerk-provider";
import { SupabaseProvider } from "./lib/supabase-provider";
import { Toaster } from "./components/ui/toaster";
import { LoadingScreen, LoadingSpinner } from "./components/ui/loading-spinner";
import MainLayout from "./components/layout/MainLayout";
import BusinessRoute from "./components/auth/BusinessRoute";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen text="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen text="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check if user has admin role
  if (!user.user_metadata?.role || user.user_metadata.role !== "admin") {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      {/* Tempo routes should be rendered first */}
      {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<ClerkAuth mode="signIn" />} />
        <Route path="/signup" element={<ClerkAuth mode="signUp" />} />
        <Route path="/auth/login" element={<Navigate to="/login" replace />} />
        <Route
          path="/auth/register"
          element={<Navigate to="/signup" replace />}
        />
        <Route
          path="/dashboard"
          element={
            <BusinessRoute>
              <Dashboard />
            </BusinessRoute>
          }
        />
        <Route path="/success" element={<Success />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/forum/category/:categoryId" element={<Forum />} />
        <Route path="/forum/thread/:threadId" element={<Forum />} />
        <Route path="/forum/new-thread/:categoryId" element={<Forum />} />
        <Route path="/forum/section/:section" element={<Forum />} />
        <Route path="/marketplace" element={<MarketplaceHome />} />
        <Route
          path="/marketplace/product/:productId"
          element={<ProductDetail />}
        />
        <Route
          path="/marketplace/wishlist"
          element={<WishlistPage />}
        />
        <Route
          path="/marketplace/sambatan"
          element={<SambatanList />}
        />
        <Route
          path="/marketplace/sambatan/:sambatanId"
          element={<SambatanPage />}
        />
        <Route
          path="/marketplace/create-sambatan/:productId"
          element={
            <PrivateRoute>
              <CreateSambatan />
            </PrivateRoute>
          }
        />
        <Route
          path="/marketplace/my-shop"
          element={
            <PrivateRoute>
              <MyShop />
            </PrivateRoute>
          }
        />
        <Route
          path="/marketplace/my-shop/new"
          element={
            <PrivateRoute>
              <ProductForm mode="create" />
            </PrivateRoute>
          }
        />
        <Route
          path="/marketplace/my-shop/edit/:productId"
          element={
            <PrivateRoute>
              <ProductForm mode="edit" />
            </PrivateRoute>
          }
        />
        <Route path="/marketplace/*" element={<Marketplace />} />
        <Route
          path="/admin/:tab?"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/messages/:conversationId?"
          element={
            <PrivateRoute>
              <Messages />
            </PrivateRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <Notifications />
            </PrivateRoute>
          }
        />
        <Route
          path="/share/:type/:id"
          element={<SharedAchievement />}
        />
        {/* Add tempobook route inside Routes */}
        {import.meta.env.VITE_TEMPO === "true" && (
          <Route path="/tempobook/*" element={<div />} />
        )}
      </Routes>
    </>
  );
}

function App() {
  return (
    <ClerkProvider>
      <SupabaseProvider>
        <AuthProvider>
          <Suspense fallback={<LoadingScreen text="Loading application..." />}>
            <AppRoutes />
          </Suspense>
          <Toaster />
        </AuthProvider>
      </SupabaseProvider>
    </ClerkProvider>
  );
}

export default App;
