// @ts-ignore
import React, { useState } from "react";
// @ts-ignore
import { useAuth } from "../../lib/auth-provider";
// @ts-ignore
import { supabase } from "../../lib/supabase";
// @ts-ignore
import { useToast } from "../../components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Input } from "../../components/ui/input";
// @ts-ignore
import { Label } from "../../components/ui/label";
// @ts-ignore
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { Loader2, Shield, CheckCircle, AlertTriangle } from "lucide-react";

interface IdentityVerificationDialogProps {
  trigger: React.ReactNode;
  conversationId: string;
  onVerificationComplete?: () => void;
}

export default function IdentityVerificationDialog({
  trigger,
  conversationId,
  onVerificationComplete,
}: IdentityVerificationDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "verified" | "failed"
  >("pending");

  const generateVerificationCode = async () => {
    if (!user) return;

    try {
      setIsGeneratingCode(true);

      // Generate a random 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);

      // Store the code in the database
      const { error } = await supabase.from("identity_verifications").insert({
        user_id: user.id,
        conversation_id: conversationId,
        verification_code: code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes expiration
      });

      if (error) throw error;

      toast({
        title: "Kode Verifikasi Dibuat",
        description:
          "Kode verifikasi telah dibuat. Bagikan kode ini dengan anggota grup untuk memverifikasi identitas Anda.",
      });
    } catch (error) {
      console.error("Error generating verification code:", error);
      toast({
        title: "Error",
        description: "Gagal membuat kode verifikasi. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const verifyIdentity = async () => {
    if (!user || !verificationCode) return;

    try {
      setIsSubmitting(true);

      // Check if the verification code is valid
      const { data, error } = await supabase
        .from("identity_verifications")
        .select("user_id, verification_code, expires_at")
        .eq("conversation_id", conversationId)
        .eq("verification_code", verificationCode)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error) {
        setVerificationStatus("failed");
        throw error;
      }

      if (!data) {
        setVerificationStatus("failed");
        throw new Error("Kode verifikasi tidak valid atau sudah kedaluwarsa");
      }

      // Update the user's verification status in the conversation
      const { error: updateError } = await supabase
        .from("private_conversation_participants")
        .update({
          is_identity_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: data.user_id,
        })
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setVerificationStatus("verified");

      toast({
        title: "Identitas Terverifikasi",
        description:
          "Identitas Anda telah diverifikasi. Anda sekarang dapat berpartisipasi dalam percakapan grup.",
      });

      // Call the callback if provided
      if (onVerificationComplete) {
        onVerificationComplete();
      }

      // Close the dialog after a delay
      setTimeout(() => {
        setOpen(false);
      }, 2000);
    } catch (error) {
      console.error("Error verifying identity:", error);
      toast({
        title: "Verifikasi Gagal",
        description:
          "Kode verifikasi tidak valid atau sudah kedaluwarsa. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-purple-600" />
            Verifikasi Identitas
          </DialogTitle>
          <DialogDescription>
            Verifikasi identitas Anda untuk meningkatkan keamanan grup chat.
            Anggota terverifikasi dapat dipercaya oleh anggota lain.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {user && (
            <div className="flex items-center p-4 bg-gray-50 rounded-md mb-4">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage
                  src={
                    user.user_metadata?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                  }
                  alt={user.user_metadata?.full_name || ""}
                />
                <AvatarFallback>
                  {user.user_metadata?.full_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {user.user_metadata?.full_name || "Pengguna"}
                </p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          )}

          {verificationStatus === "verified" ? (
            <div className="bg-green-50 p-4 rounded-md text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-green-800">
                Identitas Anda Telah Terverifikasi
              </p>
              <p className="text-sm text-green-700 mt-1">
                Anda sekarang dapat berpartisipasi dalam percakapan grup sebagai
                anggota terverifikasi.
              </p>
              <Badge className="mt-3 bg-green-100 text-green-800 hover:bg-green-200">
                Terverifikasi
              </Badge>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                {generatedCode ? (
                  <div className="bg-purple-50 p-4 rounded-md text-center">
                    <p className="text-sm text-purple-700 mb-2">
                      Kode verifikasi Anda:
                    </p>
                    <p className="text-2xl font-bold tracking-wider text-purple-800 mb-2">
                      {generatedCode}
                    </p>
                    <p className="text-xs text-purple-600">
                      Bagikan kode ini dengan anggota grup untuk memverifikasi
                      identitas Anda. Kode berlaku selama 10 menit.
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <Button
                      onClick={generateVerificationCode}
                      disabled={isGeneratingCode}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isGeneratingCode ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Membuat Kode...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Buat Kode Verifikasi
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <Label htmlFor="verification-code" className="text-sm font-medium">
                  Masukkan Kode Verifikasi
                </Label>
                <div className="flex mt-1">
                  <Input
                    id="verification-code"
                    placeholder="Masukkan kode 6 digit"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="flex-1"
                    maxLength={6}
                  />
                  <Button
                    onClick={verifyIdentity}
                    disabled={
                      isSubmitting ||
                      verificationCode.length !== 6 ||
                      !/^\d+$/.test(verificationCode)
                    }
                    className="ml-2 bg-purple-600 hover:bg-purple-700"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Verifikasi"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Masukkan kode verifikasi yang dibagikan oleh anggota grup lain
                  untuk memverifikasi identitas Anda.
                </p>
              </div>

              <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Penting untuk diketahui:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        Verifikasi identitas membantu mencegah penipuan dan
                        penyamaran
                      </li>
                      <li>
                        Hanya bagikan kode verifikasi dengan anggota grup yang
                        Anda kenal secara langsung
                      </li>
                      <li>
                        Anggota terverifikasi ditandai dengan badge khusus dalam
                        percakapan
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


