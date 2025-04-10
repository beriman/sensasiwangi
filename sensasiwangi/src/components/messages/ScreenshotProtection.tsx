import React, { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { Shield, Camera } from "lucide-react";

interface ScreenshotProtectionProps {
  children: React.ReactNode;
  conversationId: string;
  enableWatermark?: boolean;
}

export default function ScreenshotProtection({
  children,
  conversationId,
  enableWatermark = true,
}: ScreenshotProtectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(true);
  const [watermarkText, setWatermarkText] = useState("");

  useEffect(() => {
    if (!user) return;

    // Set watermark text
    setWatermarkText(`${user.user_metadata?.full_name || user.email} • ${new Date().toISOString().split("T")[0]}`);

    // Detect when the window loses focus (potential screenshot)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Log potential screenshot attempt
        logScreenshotAttempt();
      }
    };

    // Detect actual screenshot (only works in some browsers)
    const handleScreenshot = () => {
      // Show warning toast
      toast({
        title: "Screenshot Terdeteksi",
        description: "Mengambil screenshot dari percakapan pribadi tidak diizinkan dan telah dicatat.",
        variant: "destructive",
      });

      // Log screenshot
      logScreenshotAttempt(true);

      // Temporarily hide content
      setIsVisible(false);
      setTimeout(() => setIsVisible(true), 500);
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Screenshot detection (works in some browsers)
    if (navigator.mediaDevices) {
      // @ts-ignore - Non-standard API
      window.addEventListener("screenshot", handleScreenshot);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // @ts-ignore - Non-standard API
      if (navigator.mediaDevices) {
        window.removeEventListener("screenshot", handleScreenshot);
      }
    };
  }, [user, conversationId, toast]);

  // Log screenshot attempt to analytics or backend
  const logScreenshotAttempt = async (confirmed = false) => {
    if (!user) return;

    try {
      // Log to console for now
      console.log("Screenshot attempt detected", {
        userId: user.id,
        conversationId,
        timestamp: new Date().toISOString(),
        confirmed,
      });

      // In a real implementation, you would send this to your backend
      // await supabase.from("screenshot_logs").insert({
      //   user_id: user.id,
      //   conversation_id: conversationId,
      //   is_confirmed: confirmed,
      // });

      // If confirmed screenshot, notify other participants
      if (confirmed) {
        // In a real implementation, you would notify other participants
        // await supabase.from("private_messages").insert({
        //   conversation_id: conversationId,
        //   sender_id: "system",
        //   content: `<p><em>${user.user_metadata?.full_name || user.email} mengambil screenshot percakapan ini.</em></p>`,
        //   is_system_message: true,
        // });
      }
    } catch (error) {
      console.error("Error logging screenshot attempt:", error);
    }
  };

  // Generate watermark pattern
  const generateWatermarkPattern = () => {
    if (!enableWatermark || !watermarkText) return {};

    return {
      backgroundImage: `repeating-linear-gradient(45deg, rgba(150, 150, 150, 0.05), rgba(150, 150, 150, 0.05) 10px, rgba(150, 150, 150, 0.08) 10px, rgba(150, 150, 150, 0.08) 20px)`,
      position: "relative",
    };
  };

  return (
    <div
      className="screenshot-protection relative"
      style={generateWatermarkPattern()}
    >
      {/* Visible content */}
      <div className={isVisible ? "opacity-100" : "opacity-0 blur-lg"}>
        {children}
      </div>

      {/* Watermark */}
      {enableWatermark && watermarkText && (
        <>
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            {/* Diagonal watermarks */}
            <div className="absolute top-0 left-0 w-[200%] h-[200%] transform -translate-x-1/2 -translate-y-1/2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute whitespace-nowrap text-xs text-gray-300/20 font-medium transform rotate-45"
                  style={{
                    top: `${i * 10}%`,
                    left: `${i * 10}%`,
                  }}
                >
                  {watermarkText}
                </div>
              ))}
            </div>
          </div>

          {/* Screenshot warning */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 flex items-center">
            <Camera className="h-3 w-3 mr-1" />
            <span>Screenshot dilarang</span>
          </div>
        </>
      )}
    </div>
  );
}
