import { supabase } from "../../supabase/supabase";

/**
 * Generates a QR code payment for an order
 * @param orderId - The ID of the order
 * @param amount - The amount to be paid
 * @param buyerId - The ID of the buyer
 * @returns The invoice number and QR code URL
 */
export async function generateQRPayment(
  orderId: string,
  amount: number,
  buyerId: string,
) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-generate-qr-payment",
      {
        body: { orderId, amount, buyerId },
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
 * @returns The updated order data
 */
export async function simulatePaymentCallback(
  invoiceNumber: string,
  status: string,
  amount: number,
) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-process-payment-callback",
      {
        body: {
          invoice_number: invoiceNumber,
          status,
          amount,
          payment_method: "QRIS",
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
      .select("status, invoice_number, qr_code_url")
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
