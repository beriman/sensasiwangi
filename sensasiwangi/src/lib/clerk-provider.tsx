import { ClerkProvider as BaseClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { ReactNode } from "react";

interface ClerkProviderProps {
  children: ReactNode;
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error("Missing Clerk publishable key");
  }

  return (
    <BaseClerkProvider
      publishableKey={publishableKey}
      appearance={{
        baseTheme: dark,
        elements: {
          formButtonPrimary:
            "bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 text-sm font-medium",
          card: "bg-white shadow-sm rounded-2xl",
          formFieldInput:
            "h-12 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500",
          formFieldLabel: "text-sm font-medium text-gray-700",
          footerActionLink: "text-blue-600 hover:text-blue-500",
          headerTitle: "text-2xl font-bold text-gray-900",
          headerSubtitle: "text-gray-600",
        },
      }}
    >
      {children}
    </BaseClerkProvider>
  );
}
