import React, { useEffect, useState } from "react";
import { Sambatan } from "@/types/marketplace";
import SambatanCard from "./SambatanCard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Users } from "lucide-react";
import { getSambatans } from "@/lib/sambatan";

export default function SambatanGrid() {
  const [sambatans, setSambatans] = useState<Sambatan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSambatans = async () => {
      try {
        setLoading(true);
        const data = await getSambatans();
        setSambatans(data);
      } catch (error) {
        console.error("Error fetching sambatans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSambatans();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Memuat sambatan..." />
      </div>
    );
  }

  if (sambatans.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Belum ada sambatan
        </h3>
        <p className="text-gray-500">Belum ada sambatan yang aktif saat ini.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {sambatans.map((sambatan) => (
        <SambatanCard key={sambatan.id} sambatan={sambatan} />
      ))}
    </div>
  );
}
