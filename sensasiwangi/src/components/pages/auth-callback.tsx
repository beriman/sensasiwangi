// @ts-ignore
import { useEffect } from "react";
// @ts-ignore
import { useNavigate } from "react-router-dom";
// @ts-ignore
import { supabase } from "../../../supabase/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Function to handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash and query parameters
        const hash = window.location.hash;
        const query = window.location.search;

        console.log("Auth callback received", { hash, query });

        // Process the callback
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error processing auth callback:", error);
          navigate("/login?error=auth_callback_failed");
          return;
        }

        if (data?.session) {
          console.log("Authentication successful, redirecting to dashboard");
          navigate("/dashboard");
        } else {
          console.log("No session found, redirecting to success page");
          navigate("/success");
        }
      } catch (err) {
        console.error("Unexpected error in auth callback:", err);
        navigate("/login?error=unexpected_error");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  // Show a loading state while processing
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Completing Authentication
        </h1>
        <p className="text-gray-600 mb-6">
          Please wait while we complete the authentication process...
        </p>
      </div>
    </div>
  );
}

