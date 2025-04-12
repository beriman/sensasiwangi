// @ts-ignore
import { SignIn, SignUp } from "@clerk/clerk-react";
// @ts-ignore
import { dark } from "@clerk/themes";

interface ClerkAuthProps {
  mode: "signIn" | "signUp";
}

export default function ClerkAuth({ mode }: ClerkAuthProps) {
  const signInUrl = import.meta.env.VITE_CLERK_SIGN_IN_URL || "/login";
  const signUpUrl = import.meta.env.VITE_CLERK_SIGN_UP_URL || "/signup";
  const afterSignInUrl = import.meta.env.VITE_CLERK_AFTER_SIGN_IN_URL || "/dashboard";
  const afterSignUpUrl = import.meta.env.VITE_CLERK_AFTER_SIGN_UP_URL || "/dashboard";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md mx-auto">
        {mode === "signIn" ? (
          <SignIn
            appearance={{
              baseTheme: dark,
              elements: {
                formButtonPrimary:
                  "bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 text-sm font-medium",
                card: "bg-white shadow-none",
                formFieldInput:
                  "h-12 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500",
                formFieldLabel: "text-sm font-medium text-gray-700",
                footerActionLink: "text-blue-600 hover:text-blue-500",
                headerTitle: "text-2xl font-bold text-gray-900",
                headerSubtitle: "text-gray-600",
              },
            }}
            path={signInUrl}
            signUpUrl={signUpUrl}
            redirectUrl={afterSignInUrl}
            routing="path"
          />
        ) : (
          <SignUp
            appearance={{
              baseTheme: dark,
              elements: {
                formButtonPrimary:
                  "bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 text-sm font-medium",
                card: "bg-white shadow-none",
                formFieldInput:
                  "h-12 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500",
                formFieldLabel: "text-sm font-medium text-gray-700",
                footerActionLink: "text-blue-600 hover:text-blue-500",
                headerTitle: "text-2xl font-bold text-gray-900",
                headerSubtitle: "text-gray-600",
              },
            }}
            path={signUpUrl}
            signInUrl={signInUrl}
            redirectUrl={afterSignUpUrl}
            routing="path"
          />
        )}
      </div>
    </div>
  );
}

