import React, { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MarketplaceProduct, ShippingRate } from "@/types/marketplace";
import { calculateShippingCost, getShippingRates } from "@/lib/shipping";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Truck, Clock, Package } from "lucide-react";

const shippingSchema = z.object({
  shippingRateId: z.string().min(1, "Pilih metode pengiriman"),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

interface ShippingOptionsProps {
  originCity: string;
  destinationCity: string;
  onShippingSelect: (rate: ShippingRate) => void;
  selectedRateId?: string;
  product?: MarketplaceProduct;
  quantity?: number;
}

export default function ShippingOptions({
  originCity,
  destinationCity,
  onShippingSelect,
  selectedRateId,
  product,
  quantity = 1,
}: ShippingOptionsProps) {
  const [loading, setLoading] = useState(true);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      shippingRateId: selectedRateId || "",
    },
  });

  useEffect(() => {
    const fetchShippingRates = async () => {
      if (!originCity || !destinationCity) return;

      try {
        setLoading(true);
        let rates: ShippingRate[];

        // If product is provided, calculate shipping based on weight
        if (product && product.id) {
          rates = await calculateShippingCost(
            product.id,
            quantity,
            originCity,
            destinationCity,
            product.weight,
            selectedProvider || undefined,
          );
        } else {
          rates = await getShippingRates(originCity, destinationCity);
        }

        setShippingRates(rates);

        // If we have rates and no selected rate, select the first one by default
        if (rates.length > 0 && !selectedRateId) {
          form.setValue("shippingRateId", rates[0].id);
          onShippingSelect(rates[0]);
        }
      } catch (error) {
        console.error("Error fetching shipping rates:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShippingRates();
  }, [
    originCity,
    destinationCity,
    selectedRateId,
    form,
    onShippingSelect,
    product,
    quantity,
    selectedProvider,
  ]);

  const handleShippingChange = (rateId: string) => {
    const selectedRate = shippingRates.find((rate) => rate.id === rateId);
    if (selectedRate) {
      onShippingSelect(selectedRate);
    }
  };

  // Get unique providers from rates
  const providers = shippingRates.reduce<Array<{ id: string; name: string }>>(
    (acc, rate) => {
      if (rate.provider && !acc.some((p) => p.id === rate.provider_id)) {
        acc.push({
          id: rate.provider_id,
          name: rate.provider?.name || "Unknown",
        });
      }
      return acc;
    },
    [],
  );

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId === "all" ? null : providerId);
  };

  // Filter rates by selected provider
  const filteredRates = selectedProvider
    ? shippingRates.filter((rate) => rate.provider_id === selectedProvider)
    : shippingRates;

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner text="Memuat opsi pengiriman..." />
      </div>
    );
  }

  if (shippingRates.length === 0) {
    return (
      <Card className="p-4 text-center text-gray-500">
        Tidak ada opsi pengiriman yang tersedia untuk rute ini. Silakan periksa
        alamat pengiriman Anda.
      </Card>
    );
  }

  return (
    <Form {...form}>
      <div className="space-y-4">
        {/* Provider filter */}
        {providers.length > 1 && (
          <div className="mb-4">
            <FormLabel className="text-sm font-medium mb-1 block">
              Filter Kurir
            </FormLabel>
            <Select
              value={selectedProvider || "all"}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Kurir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kurir</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <FormField
          control={form.control}
          name="shippingRateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">
                Pilih Pengiriman
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleShippingChange(value);
                  }}
                  value={field.value}
                  className="space-y-2"
                >
                  {filteredRates.map((rate) => (
                    <div
                      key={rate.id}
                      className="flex items-center justify-between border rounded-md p-3 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value={rate.id} id={rate.id} />
                        <div className="flex flex-col">
                          <label
                            htmlFor={rate.id}
                            className="font-medium cursor-pointer"
                          >
                            {rate.provider?.name} - {rate.service_type}
                          </label>
                          <div className="flex items-center text-sm text-gray-500 mt-1 space-x-3">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Estimasi {rate.estimated_days} hari
                            </span>
                            {rate.weight && (
                              <span className="flex items-center">
                                <Package className="h-3 w-3 mr-1" />
                                {(rate.weight / 1000).toFixed(1)} kg
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="font-medium text-purple-600">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(rate.price)}
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}
