import { supabase } from "../../supabase/supabase";

export type PaymentMethod =
  | "QRIS"
  | "OVO"
  | "GOPAY"
  | "DANA"
  | "LINKAJA"
  | "SHOPEEPAY"
  | "BANK_TRANSFER"
  | "VIRTUAL_ACCOUNT"
  | "CREDIT_CARD";

export interface QRPaymentResponse {
  invoiceNumber: string;
  qrCodeUrl: string;
  expiryTime: string;
  transactionId: string;
  order: any;
}

/**
 * Generates a QR code payment for an order
 * @param orderId - The ID of the order
 * @param amount - The amount to be paid
 * @param buyerId - The ID of the buyer
 * @param paymentMethod - The payment method (QRIS, OVO, GOPAY, etc.)
 * @returns The invoice number, QR code URL, and other payment details
 */
export async function generateQRPayment(
  orderId: string,
  amount: number,
  buyerId: string,
  paymentMethod: PaymentMethod = "QRIS",
): Promise<QRPaymentResponse> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-generate-qr-payment",
      {
        body: { orderId, amount, buyerId, paymentMethod },
      },
    );

    if (error) {
      console.error("Error generating QR payment:", error);
      throw new Error(`Failed to generate QR payment: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in generateQRPayment:", error);
    throw error;
  }
}

/**
 * Simulates a payment callback for testing purposes
 * In production, this would be called by the payment provider's webhook
 * @param invoiceNumber - The invoice number of the order
 * @param status - The payment status (paid, failed, etc.)
 * @param amount - The amount paid
 * @param paymentMethod - The payment method used
 * @returns The updated order data
 */
export async function simulatePaymentCallback(
  invoiceNumber: string,
  status: string,
  amount: number,
  paymentMethod: PaymentMethod = "QRIS",
) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-process-payment-callback",
      {
        body: {
          invoice_number: invoiceNumber,
          status,
          amount,
          payment_method: paymentMethod,
          timestamp: new Date().toISOString(),
        },
      },
    );

    if (error) {
      console.error("Error processing payment callback:", error);
      throw new Error(`Failed to process payment callback: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in simulatePaymentCallback:", error);
    throw error;
  }
}

/**
 * Checks the payment status of an order
 * @param orderId - The ID of the order
 * @returns The payment status of the order
 */
export async function checkPaymentStatus(orderId: string) {
  try {
    const { data, error } = await supabase
      .from("marketplace_orders")
      .select(
        "status, invoice_number, qr_code_url, transaction_id, payment_method, payment_expiry",
      )
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("Error checking payment status:", error);
      throw new Error(`Failed to check payment status: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in checkPaymentStatus:", error);
    throw error;
  }
}

/**
 * Gets available payment methods
 * @returns List of available payment methods
 */
export async function getAvailablePaymentMethods() {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-get-payment-methods",
      { body: {} },
    );

    if (error) {
      console.error("Error getting payment methods:", error);
      throw new Error(`Failed to get payment methods: ${error.message}`);
    }

    return (
      data?.methods || [
        {
          id: "QRIS",
          name: "QRIS",
          logo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=QRIS",
        },
        {
          id: "OVO",
          name: "OVO",
          logo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=OVO",
        },
        {
          id: "GOPAY",
          name: "GoPay",
          logo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=GOPAY",
        },
        {
          id: "DANA",
          name: "DANA",
          logo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=DANA",
        },
      ]
    );
  } catch (error) {
    console.error("Error in getAvailablePaymentMethods:", error);
    // Return default payment methods if there's an error
    return [
      {
        id: "QRIS",
        name: "QRIS",
        logo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=QRIS",
      },
      {
        id: "OVO",
        name: "OVO",
        logo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=OVO",
      },
      {
        id: "GOPAY",
        name: "GoPay",
        logo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=GOPAY",
      },
      {
        id: "DANA",
        name: "DANA",
        logo_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=DANA",
      },
    ];
  }
}
