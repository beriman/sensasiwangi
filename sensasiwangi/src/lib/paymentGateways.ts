import { supabase } from "../../supabase/supabase";
import { PaymentMethod } from "./qrPayment";

export interface PaymentGateway {
  id: string;
  name: string;
  logo_url: string;
  description: string;
  isActive: boolean;
}

export interface BankAccount {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

export interface PaymentResponse {
  success: boolean;
  redirectUrl?: string;
  paymentCode?: string;
  expiryTime?: string;
  transactionId: string;
  message?: string;
}

/**
 * Gets all available payment gateways
 * @returns List of available payment gateways
 */
export async function getPaymentGateways(): Promise<PaymentGateway[]> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-get-payment-gateways",
      { body: {} },
    );

    if (error) {
      console.error("Error getting payment gateways:", error);
      throw new Error(`Failed to get payment gateways: ${error.message}`);
    }

    return data?.gateways || getDefaultPaymentGateways();
  } catch (error) {
    console.error("Error in getPaymentGateways:", error);
    return getDefaultPaymentGateways();
  }
}

/**
 * Gets bank accounts for bank transfer payments
 * @returns List of bank accounts
 */
export async function getBankAccounts(): Promise<BankAccount[]> {
  try {
    const { data, error } = await supabase
      .from("payment_bank_accounts")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("Error getting bank accounts:", error);
      throw new Error(`Failed to get bank accounts: ${error.message}`);
    }

    return data || getDefaultBankAccounts();
  } catch (error) {
    console.error("Error in getBankAccounts:", error);
    return getDefaultBankAccounts();
  }
}

/**
 * Process payment using selected payment method
 * @param orderId - The order ID
 * @param amount - The payment amount
 * @param buyerId - The buyer ID
 * @param paymentMethod - The selected payment method
 * @returns Payment processing result
 */
export async function processPayment(
  orderId: string,
  amount: number,
  buyerId: string,
  paymentMethod: PaymentMethod,
): Promise<PaymentResponse> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-process-payment",
      {
        body: { orderId, amount, buyerId, paymentMethod },
      },
    );

    if (error) {
      console.error("Error processing payment:", error);
      throw new Error(`Failed to process payment: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error("Error in processPayment:", error);
    throw error;
  }
}

/**
 * Default payment gateways for fallback
 */
function getDefaultPaymentGateways(): PaymentGateway[] {
  return [
    {
      id: "QRIS",
      name: "QRIS",
      logo_url:
        "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=200&q=80",
      description:
        "Bayar dengan scan QR code dari aplikasi e-wallet atau mobile banking",
      isActive: true,
    },
    {
      id: "OVO",
      name: "OVO",
      logo_url:
        "https://images.unsplash.com/photo-1622012864015-a832e1b3a3c4?w=200&q=80",
      description: "Bayar langsung menggunakan saldo OVO",
      isActive: true,
    },
    {
      id: "GOPAY",
      name: "GoPay",
      logo_url:
        "https://images.unsplash.com/photo-1622012849272-a81f1d5eb0a9?w=200&q=80",
      description: "Bayar langsung menggunakan saldo GoPay",
      isActive: true,
    },
    {
      id: "DANA",
      name: "DANA",
      logo_url:
        "https://images.unsplash.com/photo-1622012847664-b8e3e0a3b777?w=200&q=80",
      description: "Bayar langsung menggunakan saldo DANA",
      isActive: true,
    },
    {
      id: "BANK_TRANSFER",
      name: "Transfer Bank",
      logo_url:
        "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=200&q=80",
      description: "Transfer manual ke rekening bank kami",
      isActive: true,
    },
    {
      id: "VIRTUAL_ACCOUNT",
      name: "Virtual Account",
      logo_url:
        "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=200&q=80",
      description: "Bayar melalui virtual account bank",
      isActive: true,
    },
    {
      id: "CREDIT_CARD",
      name: "Kartu Kredit",
      logo_url:
        "https://images.unsplash.com/photo-1622012864015-a832e1b3a3c4?w=200&q=80",
      description: "Bayar dengan kartu kredit",
      isActive: true,
    },
  ];
}

/**
 * Default bank accounts for fallback
 */
function getDefaultBankAccounts(): BankAccount[] {
  return [
    {
      bank_name: "BCA",
      account_number: "1234567890",
      account_holder: "Sensasi Wangi Indonesia",
    },
    {
      bank_name: "Mandiri",
      account_number: "0987654321",
      account_holder: "Sensasi Wangi Indonesia",
    },
    {
      bank_name: "BNI",
      account_number: "1122334455",
      account_holder: "Sensasi Wangi Indonesia",
    },
  ];
}
