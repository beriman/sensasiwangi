import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserRole: (userId: string, role: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook for handling OAuth redirects
function useHandleOAuthRedirect(setUser: (user: User | null) => void) {
  useEffect(() => {
    const handleHashFragment = async () => {
      if (
        window.location.hash &&
        window.location.hash.includes("access_token")
      ) {
        // The hash contains auth tokens - let Supabase handle it
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          return;
        }

        if (data.session) {
          setUser(data.session.user);
          // Clear the hash fragment without reloading the page
          window.history.replaceState(
            null,
            document.title,
            window.location.pathname,
          );
          // Redirect to dashboard
          window.location.href = "/dashboard";
        }
      }
    };

    handleHashFragment();
  }, [setUser]);
}

// Auth Provider Component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle OAuth redirects
  useHandleOAuthRedirect(setUser);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: string = "user",
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });
    if (error) throw error;
  };

  const updateUserRole = async (userId: string, role: string) => {
    // Update the user's role in the auth.users metadata
    const { error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: { role } },
    );

    if (authError) throw authError;

    // Also update the role in the public.users table
    const { error: dbError } = await supabase
      .from("users")
      .update({ role })
      .eq("id", userId);

    if (dbError) throw dbError;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    // Get the current URL's origin to ensure we redirect back to the same domain
    const currentOrigin = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${currentOrigin}/success`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Auth Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
