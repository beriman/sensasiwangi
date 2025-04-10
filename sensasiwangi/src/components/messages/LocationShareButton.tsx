import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface LocationShareButtonProps {
  onSelectLocation: (location: { lat: number; lng: number; address: string }) => void;
}

export default function LocationShareButton({
  onSelectLocation,
}: LocationShareButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung oleh browser Anda.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Try to get address using reverse geocoding
          let address = "Lokasi Anda";
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            if (data && data.display_name) {
              address = data.display_name;
            }
          } catch (error) {
            console.error("Error getting address:", error);
            // Continue with default address if geocoding fails
          }

          setCurrentLocation({
            lat: latitude,
            lng: longitude,
            address,
          });
        } catch (error) {
          console.error("Error getting location:", error);
          setError("Gagal mendapatkan lokasi Anda. Silakan coba lagi.");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setError(
          error.code === 1
            ? "Izin lokasi ditolak. Silakan aktifkan izin lokasi di browser Anda."
            : "Gagal mendapatkan lokasi Anda. Silakan coba lagi."
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleShareLocation = () => {
    if (!currentLocation) return;
    
    onSelectLocation(currentLocation);
    setOpen(false);
    
    toast({
      title: "Lokasi Dibagikan",
      description: "Lokasi Anda telah berhasil dibagikan.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          <MapPin className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bagikan Lokasi</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {error ? (
            <div className="text-center py-8">
              <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
                {error}
              </div>
              <Button onClick={getLocation}>Coba Lagi</Button>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Mendapatkan lokasi Anda...</p>
            </div>
          ) : currentLocation ? (
            <div className="space-y-4">
              <div className="aspect-video relative rounded-md overflow-hidden border">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                    currentLocation.lng - 0.01
                  },${currentLocation.lat - 0.01},${
                    currentLocation.lng + 0.01
                  },${
                    currentLocation.lat + 0.01
                  }&layer=mapnik&marker=${currentLocation.lat},${
                    currentLocation.lng
                  }`}
                  allowFullScreen
                ></iframe>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-sm mb-1">Alamat:</h4>
                <p className="text-sm text-gray-600">{currentLocation.address}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">
                Bagikan lokasi Anda saat ini dengan peserta percakapan.
              </p>
              <Button onClick={getLocation}>Dapatkan Lokasi Saat Ini</Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="mr-2"
          >
            Batal
          </Button>
          <Button
            onClick={handleShareLocation}
            disabled={!currentLocation || loading}
          >
            Bagikan Lokasi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
