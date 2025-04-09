import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { createContext, useContext, ReactNode } from "react";

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: () => void;
  signUp: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, signOut } = useClerkAuth();
  const { user } = useUser();

  // Redirect to Clerk sign-in page
  const signIn = () => {
    window.location.href = import.meta.env.VITE_CLERK_SIGN_IN_URL || "/login";
  };

  // Redirect to Clerk sign-up page
  const signUp = () => {
    window.location.href = import.meta.env.VITE_CLERK_SIGN_UP_URL || "/signup";
  };

  return (
    <AuthContext.Provider
      value={{
        user: isSignedIn ? user : null,
        loading: !isLoaded,
        signIn,
        signUp,
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
