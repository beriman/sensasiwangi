import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShippingAddress } from "@/types/marketplace";
import {
  saveUserShippingAddress,
  getUserShippingAddress,
} from "@/lib/shipping";
import { useAuth } from "../../../supabase/auth";
import { useToast } from "@/components/ui/use-toast";

const shippingAddressSchema = z.object({
  address: z.string().min(5, "Alamat harus diisi minimal 5 karakter"),
  city: z.string().min(2, "Kota harus diisi"),
  province: z.string().min(2, "Provinsi harus diisi"),
  postal_code: z.string().min(5, "Kode pos harus diisi dengan benar"),
  phone: z.string().min(10, "Nomor telepon harus diisi dengan benar"),
});

type ShippingAddressFormValues = z.infer<typeof shippingAddressSchema>;

interface ShippingAddressFormProps {
  onAddressSubmit?: (address: ShippingAddress) => void;
  existingAddress?: ShippingAddress | null;
  buttonText?: string;
}

export default function ShippingAddressForm({
  onAddressSubmit,
  existingAddress,
  buttonText = "Simpan Alamat",
}: ShippingAddressFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<ShippingAddressFormValues>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      address: existingAddress?.address || "",
      city: existingAddress?.city || "",
      province: existingAddress?.province || "",
      postal_code: existingAddress?.postal_code || "",
      phone: existingAddress?.phone || "",
    },
  });

  useEffect(() => {
    const fetchAddress = async () => {
      if (user && !existingAddress) {
        try {
          setLoading(true);
          const address = await getUserShippingAddress(user.id);
          if (address) {
            form.reset({
              address: address.address,
              city: address.city,
              province: address.province,
              postal_code: address.postal_code,
              phone: address.phone,
            });
          }
        } catch (error) {
          console.error("Error fetching shipping address:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAddress();
  }, [user, existingAddress, form]);

  const onSubmit = async (values: ShippingAddressFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Anda harus login untuk menyimpan alamat pengiriman",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await saveUserShippingAddress(
        user.id,
        values.address,
        values.city,
        values.province,
        values.postal_code,
        values.phone,
      );

      toast({
        title: "Berhasil",
        description: "Alamat pengiriman berhasil disimpan",
      });

      if (onAddressSubmit) {
        onAddressSubmit(values);
      }
    } catch (error) {
      console.error("Error saving shipping address:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan alamat pengiriman. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !existingAddress) {
    return <div className="p-4 text-center">Memuat alamat pengiriman...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alamat Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="Jl. Contoh No. 123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kota</FormLabel>
                <FormControl>
                  <Input placeholder="Jakarta" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="province"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provinsi</FormLabel>
                <FormControl>
                  <Input placeholder="DKI Jakarta" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kode Pos</FormLabel>
                <FormControl>
                  <Input placeholder="12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor Telepon</FormLabel>
                <FormControl>
                  <Input placeholder="08123456789" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full md:w-auto bg-purple-600 hover:bg-purple-700"
          disabled={loading}
        >
          {loading ? "Menyimpan..." : buttonText}
        </Button>
      </form>
    </Form>
  );
}
