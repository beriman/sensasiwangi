// Fixed Google OAuth issues and display name
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../src/supabase/supabase";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get session from local storage
    const storedSession = localStorage.getItem("supabase.auth.token");
    if (storedSession) {
      try {
        const { currentSession } = JSON.parse(storedSession);
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
        }
      } catch (error) {
        console.error("Error parsing stored session:", error);
      }
    }

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        // Store session in local storage
        if (newSession) {
          localStorage.setItem(
            "supabase.auth.token",
            JSON.stringify({
              currentSession: newSession,
            })
          );
        } else {
          localStorage.removeItem("supabase.auth.token");
        }

        // If user just signed up or signed in, update their metadata
        if (
          (event === "SIGNED_IN" || event === "SIGNED_UP") &&
          newSession?.user
        ) {
          const { error } = await supabase
            .from("users")
            .upsert(
              {
                id: newSession.user.id,
                email: newSession.user.email,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" }
            );

          if (error) {
            console.error("Error updating user metadata:", error);
          }
        }
      }
    );

    // Initial session check
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
      }
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async () => {
    try {
      // Get the current URL's origin to ensure we redirect back to the same domain
      const currentOrigin = window.location.origin;

      // For development, use the current origin; for production, use the configured site URL
      const redirectUrl = process.env.NODE_ENV === 'development'
        ? `${currentOrigin}/auth/callback`
        : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://sensasiwangi.id'}/auth/callback`;

      console.log('OAuth redirect URL:', redirectUrl);

      // Set up the OAuth configuration
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        console.error('Google OAuth error:', error);
        throw error;
      }

      console.log('OAuth initiated successfully', data);
    } catch (error) {
      console.error('Failed to sign in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
