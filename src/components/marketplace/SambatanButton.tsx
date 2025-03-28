import React from "react";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useAuth } from "../../../supabase/auth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface SambatanButtonProps {
  productId: string;
  className?: string;
}

export default function SambatanButton({
  productId,
  className,
}: SambatanButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSambatan = async () => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk membuat Sambatan.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    try {
      // Navigate to create sambatan page
      navigate(`/marketplace/sambatan/create/${productId}`);
    } catch (error) {
      console.error("Error creating sambatan:", error);
      toast({
        title: "Error",
        description: "Gagal membuat Sambatan. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleSambatan}
      variant="outline"
      className={`flex items-center ${className}`}
    >
      <Users className="h-4 w-4 mr-2" />
      Beli dengan Sambatan
    </Button>
  );
}
