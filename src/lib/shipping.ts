import { supabase } from "../../supabase/supabase";
import {
  ShippingProvider,
  ShippingRate,
  ShippingTrackingUpdate,
  ShippingTrackingDetail,
} from "@/types/marketplace";

// Get all active shipping providers
export async function getShippingProviders(): Promise<ShippingProvider[]> {
  const { data, error } = await supabase
    .from("shipping_providers")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data || [];
}

// Get shipping rates for a specific route
export async function getShippingRates(
  originCity: string,
  destinationCity: string,
): Promise<ShippingRate[]> {
  try {
    // First try to get rates from the database
    const { data, error } = await supabase
      .from("shipping_rates")
      .select(
        `
        *,
        provider:provider_id(*)
      `,
      )
      .eq("origin_city", originCity)
      .eq("destination_city", destinationCity)
      .order("price");

    if (error) throw error;

    // If we have rates in the database, return them
    if (data && data.length > 0) {
      return data;
    }

    // If no rates in database, fetch from shipping API
    return await fetchShippingRatesFromAPI(originCity, destinationCity);
  } catch (error) {
    console.error("Error getting shipping rates:", error);
    // Return mock data if API fails
    return getMockShippingRates(originCity, destinationCity);
  }
}

// Fetch shipping rates from external API
async function fetchShippingRatesFromAPI(
  originCity: string,
  destinationCity: string,
  weight: number = 1000, // Default weight in grams (1kg)
): Promise<ShippingRate[]> {
  try {
    // In a real implementation, this would call the actual shipping API endpoints
    // For now, we'll simulate an API call with a timeout
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get shipping providers from database
    const providers = await getShippingProviders();

    // Generate rates for each provider
    const rates: ShippingRate[] = [];

    for (const provider of providers) {
      // Generate 2-3 service types per provider
      const serviceTypes = getProviderServiceTypes(provider.code);

      for (const serviceType of serviceTypes) {
        // Calculate price based on distance and weight
        const basePrice = calculateBasePrice(originCity, destinationCity);
        const weightFactor = weight / 1000; // Convert to kg
        const price = Math.round(
          basePrice * weightFactor * serviceType.priceFactor,
        );

        // Calculate estimated days
        const estimatedDays = serviceType.estimatedDays;

        // Create rate object
        const rate: ShippingRate = {
          id: `${provider.id}-${serviceType.code}-${Date.now()}`,
          provider_id: provider.id,
          provider: provider,
          origin_city: originCity,
          destination_city: destinationCity,
          service_type: serviceType.name,
          service_code: serviceType.code,
          price: price,
          estimated_days: estimatedDays,
          weight: weight,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        rates.push(rate);
      }
    }

    // Sort by price
    rates.sort((a, b) => a.price - b.price);

    // Save rates to database for future use
    await saveShippingRatesToDatabase(rates);

    return rates;
  } catch (error) {
    console.error("Error fetching shipping rates from API:", error);
    return getMockShippingRates(originCity, destinationCity);
  }
}

// Save shipping rates to database
async function saveShippingRatesToDatabase(
  rates: ShippingRate[],
): Promise<void> {
  try {
    // Only save if we have rates
    if (rates.length === 0) return;

    // Insert rates into database
    const { error } = await supabase.from("shipping_rates").insert(
      rates.map((rate) => ({
        provider_id: rate.provider_id,
        origin_city: rate.origin_city,
        destination_city: rate.destination_city,
        service_type: rate.service_type,
        service_code: rate.service_code,
        price: rate.price,
        estimated_days: rate.estimated_days,
        weight: rate.weight,
      })),
    );

    if (error) throw error;
  } catch (error) {
    console.error("Error saving shipping rates to database:", error);
  }
}

// Get mock shipping rates for testing
function getMockShippingRates(
  originCity: string,
  destinationCity: string,
): ShippingRate[] {
  const mockProviders = [
    {
      id: "jne",
      name: "JNE",
      code: "jne",
      logo_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "jnt",
      name: "J&T Express",
      code: "jnt",
      logo_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "sicepat",
      name: "SiCepat",
      code: "sicepat",
      logo_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockRates: ShippingRate[] = [
    {
      id: "jne-reg-1",
      provider_id: "jne",
      provider: mockProviders[0],
      origin_city: originCity,
      destination_city: destinationCity,
      service_type: "REG",
      service_code: "reg",
      price: 15000,
      estimated_days: 2,
      weight: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "jne-yes-1",
      provider_id: "jne",
      provider: mockProviders[0],
      origin_city: originCity,
      destination_city: destinationCity,
      service_type: "YES",
      service_code: "yes",
      price: 25000,
      estimated_days: 1,
      weight: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "jnt-reg-1",
      provider_id: "jnt",
      provider: mockProviders[1],
      origin_city: originCity,
      destination_city: destinationCity,
      service_type: "Regular",
      service_code: "reg",
      price: 14000,
      estimated_days: 2,
      weight: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "sicepat-reg-1",
      provider_id: "sicepat",
      provider: mockProviders[2],
      origin_city: originCity,
      destination_city: destinationCity,
      service_type: "SIUNT",
      service_code: "siunt",
      price: 13000,
      estimated_days: 3,
      weight: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "sicepat-best-1",
      provider_id: "sicepat",
      provider: mockProviders[2],
      origin_city: originCity,
      destination_city: destinationCity,
      service_type: "BEST",
      service_code: "best",
      price: 22000,
      estimated_days: 1,
      weight: 1000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  return mockRates;
}

// Get service types for a provider
function getProviderServiceTypes(providerCode: string): Array<{
  name: string;
  code: string;
  priceFactor: number;
  estimatedDays: number;
}> {
  switch (providerCode.toLowerCase()) {
    case "jne":
      return [
        { name: "REG", code: "reg", priceFactor: 1.0, estimatedDays: 2 },
        { name: "YES", code: "yes", priceFactor: 1.7, estimatedDays: 1 },
        { name: "OKE", code: "oke", priceFactor: 0.8, estimatedDays: 3 },
      ];
    case "jnt":
      return [
        { name: "Regular", code: "reg", priceFactor: 0.95, estimatedDays: 2 },
        {
          name: "Express",
          code: "express",
          priceFactor: 1.6,
          estimatedDays: 1,
        },
      ];
    case "sicepat":
      return [
        { name: "SIUNT", code: "siunt", priceFactor: 0.9, estimatedDays: 3 },
        { name: "BEST", code: "best", priceFactor: 1.5, estimatedDays: 1 },
        { name: "REG", code: "reg", priceFactor: 1.1, estimatedDays: 2 },
      ];
    default:
      return [
        { name: "Regular", code: "reg", priceFactor: 1.0, estimatedDays: 2 },
        {
          name: "Express",
          code: "express",
          priceFactor: 1.5,
          estimatedDays: 1,
        },
      ];
  }
}

// Calculate base price based on origin and destination
function calculateBasePrice(
  originCity: string,
  destinationCity: string,
): number {
  // In a real implementation, this would use distance calculation
  // For now, we'll use a simple algorithm based on string comparison

  // Same city
  if (originCity.toLowerCase() === destinationCity.toLowerCase()) {
    return 10000; // Base price for same city
  }

  // Different city, calculate "distance" based on string similarity
  const cityDistance = Math.abs(originCity.length - destinationCity.length);
  return 12000 + cityDistance * 1000; // Base price increases with "distance"
}

// Calculate shipping cost based on product weight and dimensions
export async function calculateShippingCost(
  productId: string,
  quantity: number,
  originCity: string,
  destinationCity: string,
  weight?: number,
  providerId?: string,
): Promise<ShippingRate[]> {
  try {
    // Get product weight if not provided
    if (!weight && productId) {
      const { data: product } = await supabase
        .from("marketplace_products")
        .select("weight, dimensions")
        .eq("id", productId)
        .single();

      if (product && product.weight) {
        weight = product.weight * quantity;
      } else {
        weight = 1000 * quantity; // Default 1kg per item
      }
    } else if (!weight) {
      weight = 1000 * quantity; // Default 1kg per item
    }

    // Get shipping rates
    let rates = await fetchShippingRatesFromAPI(
      originCity,
      destinationCity,
      weight,
    );

    // Filter by provider if specified
    if (providerId) {
      rates = rates.filter((rate) => rate.provider_id === providerId);
    }

    return rates;
  } catch (error) {
    console.error("Error calculating shipping cost:", error);
    return getMockShippingRates(originCity, destinationCity);
  }
}

// Calculate shared shipping cost for Sambatan participants
export async function calculateSambatanShippingCost(
  sambatanId: string,
  productId: string,
  originCity: string,
): Promise<{ [participantId: string]: ShippingRate[] }> {
  try {
    // Get all participants and their shipping addresses
    const { data: participants, error } = await supabase
      .from("sambatan_participants")
      .select(
        `
        id,
        participant_id,
        quantity,
        participant:participant_id(id, shipping_city)
      `,
      )
      .eq("sambatan_id", sambatanId);

    if (error) throw error;
    if (!participants || participants.length === 0) return {};

    // Get product weight
    const { data: product } = await supabase
      .from("marketplace_products")
      .select("weight, dimensions")
      .eq("id", productId)
      .single();

    const productWeight = product?.weight || 1000; // Default 1kg if not specified

    // Calculate shipping rates for each participant
    const shippingRates: { [participantId: string]: ShippingRate[] } = {};

    for (const participant of participants) {
      const participantId = participant.participant_id;
      const quantity = participant.quantity;
      const destinationCity = participant.participant?.shipping_city;

      if (!destinationCity) {
        console.warn(`No shipping city found for participant ${participantId}`);
        continue;
      }

      // Calculate weight based on quantity
      const weight = productWeight * quantity;

      // Get shipping rates for this participant
      const rates = await fetchShippingRatesFromAPI(
        originCity,
        destinationCity,
        weight,
      );

      shippingRates[participantId] = rates;
    }

    return shippingRates;
  } catch (error) {
    console.error("Error calculating sambatan shipping costs:", error);
    return {};
  }
}

// Get optimal shipping option for Sambatan (lowest total cost)
export async function getOptimalSambatanShipping(
  sambatanId: string,
  productId: string,
  originCity: string,
): Promise<{
  totalCost: number;
  providerCode: string;
  participantRates: { [participantId: string]: ShippingRate };
  individualTotalCost: number;
  savings: number;
  individualRates: { [participantId: string]: ShippingRate };
}> {
  try {
    const allRates = await calculateSambatanShippingCost(
      sambatanId,
      productId,
      originCity,
    );

    // Group rates by provider
    const providerRates: {
      [providerCode: string]: {
        totalCost: number;
        participantRates: { [participantId: string]: ShippingRate };
      };
    } = {};

    // Track the cheapest individual rates for each participant
    const cheapestIndividualRates: { [participantId: string]: ShippingRate } =
      {};
    let individualTotalCost = 0;

    // For each participant
    for (const [participantId, rates] of Object.entries(allRates)) {
      if (rates.length === 0) continue;

      // Find cheapest individual rate for this participant
      const cheapestRate = [...rates].sort((a, b) => a.price - b.price)[0];
      cheapestIndividualRates[participantId] = cheapestRate;
      individualTotalCost += cheapestRate.price;

      // For each shipping option available to this participant
      for (const rate of rates) {
        const providerCode = rate.provider?.code || "unknown";

        if (!providerRates[providerCode]) {
          providerRates[providerCode] = {
            totalCost: 0,
            participantRates: {},
          };
        }

        providerRates[providerCode].totalCost += rate.price;
        providerRates[providerCode].participantRates[participantId] = rate;
      }
    }

    // Find provider with lowest total cost
    let lowestCost = Infinity;
    let bestProvider = "";
    let bestRates: { [participantId: string]: ShippingRate } = {};

    for (const [providerCode, data] of Object.entries(providerRates)) {
      // Only consider providers that have rates for all participants
      const participantCount = Object.keys(allRates).length;
      const coveredParticipantCount = Object.keys(data.participantRates).length;

      if (
        coveredParticipantCount === participantCount &&
        data.totalCost < lowestCost
      ) {
        lowestCost = data.totalCost;
        bestProvider = providerCode;
        bestRates = data.participantRates;
      }
    }

    // Calculate savings compared to individual best rates
    const savings = individualTotalCost - lowestCost;

    return {
      totalCost: lowestCost,
      providerCode: bestProvider,
      participantRates: bestRates,
      individualTotalCost,
      savings,
      individualRates: cheapestIndividualRates,
    };
  } catch (error) {
    console.error("Error finding optimal sambatan shipping:", error);
    return {
      totalCost: 0,
      providerCode: "",
      participantRates: {},
      individualTotalCost: 0,
      savings: 0,
      individualRates: {},
    };
  }
}

// Add a tracking update for an order
export async function addTrackingUpdate(
  orderId: string,
  status: string,
  description?: string,
  location?: string,
): Promise<ShippingTrackingUpdate> {
  const { data, error } = await supabase
    .from("shipping_tracking_updates")
    .insert({
      order_id: orderId,
      status,
      description: description || null,
      location: location || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Also update the order's shipping status
  await supabase
    .from("marketplace_orders")
    .update({
      shipping_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  return data;
}

// Get tracking updates for an order
export async function getTrackingUpdates(
  orderId: string,
): Promise<ShippingTrackingUpdate[]> {
  const { data, error } = await supabase
    .from("shipping_tracking_updates")
    .select("*")
    .eq("order_id", orderId)
    .order("timestamp", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get real-time tracking information from shipping provider API
export async function getTrackingInfo(
  trackingNumber: string,
  providerCode: string,
): Promise<ShippingTrackingDetail> {
  try {
    // In a real implementation, this would call the actual shipping API
    // For now, we'll simulate an API call with mock data

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Generate mock tracking data
    const mockTrackingData = generateMockTrackingData(
      trackingNumber,
      providerCode,
    );

    return mockTrackingData;
  } catch (error) {
    console.error(`Error fetching tracking info for ${trackingNumber}:`, error);
    throw error;
  }
}

// Generate mock tracking data
function generateMockTrackingData(
  trackingNumber: string,
  providerCode: string,
): ShippingTrackingDetail {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  // Use the last digit of tracking number to determine status
  const lastDigit = parseInt(trackingNumber.slice(-1));

  let status: string;
  let updates: Array<{
    timestamp: string;
    status: string;
    description: string;
    location: string;
  }>;

  if (lastDigit >= 8) {
    // Delivered
    status = "delivered";
    updates = [
      {
        timestamp: now.toISOString(),
        status: "delivered",
        description: "Paket telah diterima oleh [Penerima].",
        location: "Jakarta Selatan",
      },
      {
        timestamp: yesterday.toISOString(),
        status: "out_for_delivery",
        description: "Paket sedang dalam proses pengiriman ke alamat tujuan.",
        location: "Jakarta Selatan",
      },
      {
        timestamp: twoDaysAgo.toISOString(),
        status: "in_transit",
        description: "Paket telah tiba di gudang tujuan.",
        location: "Jakarta",
      },
      {
        timestamp: new Date(
          twoDaysAgo.getTime() - 12 * 60 * 60 * 1000,
        ).toISOString(),
        status: "in_transit",
        description: "Paket dalam perjalanan ke kota tujuan.",
        location: "Bandung",
      },
      {
        timestamp: new Date(
          twoDaysAgo.getTime() - 24 * 60 * 60 * 1000,
        ).toISOString(),
        status: "processed",
        description: "Paket telah diproses di gudang asal.",
        location: "Bandung",
      },
    ];
  } else if (lastDigit >= 5) {
    // In transit
    status = "in_transit";
    updates = [
      {
        timestamp: now.toISOString(),
        status: "in_transit",
        description: "Paket telah tiba di gudang tujuan.",
        location: "Jakarta",
      },
      {
        timestamp: yesterday.toISOString(),
        status: "in_transit",
        description: "Paket dalam perjalanan ke kota tujuan.",
        location: "Bandung",
      },
      {
        timestamp: twoDaysAgo.toISOString(),
        status: "processed",
        description: "Paket telah diproses di gudang asal.",
        location: "Bandung",
      },
    ];
  } else if (lastDigit >= 2) {
    // Processed
    status = "processed";
    updates = [
      {
        timestamp: now.toISOString(),
        status: "processed",
        description: "Paket telah diproses di gudang asal.",
        location: "Bandung",
      },
      {
        timestamp: yesterday.toISOString(),
        status: "picked_up",
        description: "Paket telah diambil oleh kurir.",
        location: "Bandung",
      },
    ];
  } else {
    // Picked up
    status = "picked_up";
    updates = [
      {
        timestamp: now.toISOString(),
        status: "picked_up",
        description: "Paket telah diambil oleh kurir.",
        location: "Bandung",
      },
    ];
  }

  return {
    tracking_number: trackingNumber,
    provider_code: providerCode,
    status,
    estimated_delivery: new Date(
      now.getTime() + 2 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    last_update: now.toISOString(),
    updates,
  };
}

// Update shipping information for an order
export async function updateOrderShipping(
  orderId: string,
  updates: {
    shipping_provider_id?: string;
    shipping_cost?: number;
    shipping_tracking_number?: string;
    shipping_status?: string;
    estimated_delivery_date?: string;
  },
): Promise<void> {
  const { error } = await supabase
    .from("marketplace_orders")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) throw error;
}

// Save user shipping address
export async function saveUserShippingAddress(
  userId: string,
  address: string,
  city: string,
  province: string,
  postalCode: string,
  phone: string,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      shipping_address: address,
      shipping_city: city,
      shipping_province: province,
      shipping_postal_code: postalCode,
      shipping_phone: phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
}

// Get user shipping address
export async function getUserShippingAddress(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "shipping_address, shipping_city, shipping_province, shipping_postal_code, shipping_phone",
    )
    .eq("id", userId)
    .single();

  if (error) throw error;

  if (!data.shipping_address) return null;

  return {
    address: data.shipping_address,
    city: data.shipping_city,
    province: data.shipping_province,
    postal_code: data.shipping_postal_code,
    phone: data.shipping_phone,
  };
}
