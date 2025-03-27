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
import { ShippingRate } from "@/types/marketplace";
import { getShippingRates } from "@/lib/shipping";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card } from "@/components/ui/card";

const shippingSchema = z.object({
  shippingRateId: z.string().min(1, "Pilih metode pengiriman"),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

interface ShippingOptionsProps {
  originCity: string;
  destinationCity: string;
  onShippingSelect: (rate: ShippingRate) => void;
  selectedRateId?: string;
}

export default function ShippingOptions({
  originCity,
  destinationCity,
  onShippingSelect,
  selectedRateId,
}: ShippingOptionsProps) {
  const [loading, setLoading] = useState(true);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);

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
        const rates = await getShippingRates(originCity, destinationCity);
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
  }, [originCity, destinationCity, selectedRateId, form, onShippingSelect]);

  const handleShippingChange = (rateId: string) => {
    const selectedRate = shippingRates.find((rate) => rate.id === rateId);
    if (selectedRate) {
      onShippingSelect(selectedRate);
    }
  };

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
                  {shippingRates.map((rate) => (
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
                          <span className="text-sm text-gray-500">
                            Estimasi {rate.estimated_days} hari
                          </span>
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
