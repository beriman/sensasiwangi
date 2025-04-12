import { supabase } from "../../supabase/supabase";
import {
  MarketplaceDispute,
  DisputeMessage,
  MarketplaceRefund,
} from "../types/dispute";

// Create a new dispute
export async function createDispute(
  transactionId: string,
  reason: string,
): Promise<MarketplaceDispute> {
  const { data, error } = await supabase
    .from("marketplace_disputes")
    .insert({
      transaction_id: transactionId,
      reason,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get disputes for the current user (as buyer)
export async function getUserDisputes(): Promise<MarketplaceDispute[]> {
  const { data, error } = await supabase
    .from("marketplace_disputes")
    .select(
      `
      *,
      transaction:transaction_id(id, product_name, amount,
        seller:seller_id(full_name, email),
        buyer:buyer_id(full_name, email)
      ),
      initiator:initiator_id(full_name, email)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get disputes for transactions where the current user is the seller
export async function getSellerDisputes(): Promise<MarketplaceDispute[]> {
  const { data, error } = await supabase
    .from("marketplace_disputes")
    .select(
      `
      *,
      transaction:transaction_id(id, product_name, amount,
        seller:seller_id(full_name, email),
        buyer:buyer_id(full_name, email)
      ),
      initiator:initiator_id(full_name, email)
    `,
    )
    .filter(
      "transaction_id",
      "in",
      `(SELECT id FROM marketplace_transactions WHERE seller_id = auth.uid())`,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get a single dispute by ID
export async function getDispute(
  disputeId: string,
): Promise<MarketplaceDispute | null> {
  const { data, error } = await supabase
    .from("marketplace_disputes")
    .select(
      `
      *,
      transaction:transaction_id(id, product_name, amount,
        seller:seller_id(full_name, email),
        buyer:buyer_id(full_name, email)
      ),
      initiator:initiator_id(full_name, email)
    `,
    )
    .eq("id", disputeId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }
  return data;
}

// Get messages for a dispute
export async function getDisputeMessages(
  disputeId: string,
): Promise<DisputeMessage[]> {
  const { data, error } = await supabase
    .from("marketplace_dispute_messages")
    .select(
      `
      *,
      sender:sender_id(full_name, avatar_url)
    `,
    )
    .eq("dispute_id", disputeId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

// Add a message to a dispute
export async function addDisputeMessage(
  disputeId: string,
  message: string,
): Promise<DisputeMessage> {
  const { data, error } = await supabase
    .from("marketplace_dispute_messages")
    .insert({
      dispute_id: disputeId,
      message,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update dispute status (admin only)
export async function updateDisputeStatus(
  disputeId: string,
  status: MarketplaceDispute["status"],
  adminNotes?: string,
): Promise<MarketplaceDispute> {
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (adminNotes) {
    updates.admin_notes = adminNotes;
  }

  if (
    status === "resolved_buyer" ||
    status === "resolved_seller" ||
    status === "rejected"
  ) {
    updates.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("marketplace_disputes")
    .update(updates)
    .eq("id", disputeId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Create a refund
export async function createRefund(
  transactionId: string,
  amount: number,
  reason: string,
  disputeId?: string,
): Promise<MarketplaceRefund> {
  const { data, error } = await supabase
    .from("marketplace_refunds")
    .insert({
      transaction_id: transactionId,
      dispute_id: disputeId || null,
      amount,
      refund_reason: reason,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get refunds for a transaction
export async function getTransactionRefunds(
  transactionId: string,
): Promise<MarketplaceRefund[]> {
  const { data, error } = await supabase
    .from("marketplace_refunds")
    .select(
      `
      *,
      admin:admin_id(full_name),
      transaction:transaction_id(product_name, buyer:buyer_id(full_name, email))
    `,
    )
    .eq("transaction_id", transactionId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Update refund status (admin only)
export async function updateRefundStatus(
  refundId: string,
  status: MarketplaceRefund["status"],
  adminNotes?: string,
): Promise<MarketplaceRefund> {
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (adminNotes) {
    updates.admin_notes = adminNotes;
  }

  if (status === "completed") {
    updates.completed_at = new Date().toISOString();
    updates.admin_id = (await supabase.auth.getUser()).data.user?.id;
  }

  const { data, error } = await supabase
    .from("marketplace_refunds")
    .update(updates)
    .eq("id", refundId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get all refunds (admin only)
export async function getAllRefunds(): Promise<MarketplaceRefund[]> {
  const { data, error } = await supabase
    .from("marketplace_refunds")
    .select(
      `
      *,
      admin:admin_id(full_name),
      transaction:transaction_id(product_name, buyer:buyer_id(full_name, email))
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get all disputes (admin only)
export async function getAllDisputes(): Promise<MarketplaceDispute[]> {
  const { data, error } = await supabase
    .from("marketplace_disputes")
    .select(
      `
      *,
      transaction:transaction_id(id, product_name, amount,
        seller:seller_id(full_name, email),
        buyer:buyer_id(full_name, email)
      ),
      initiator:initiator_id(full_name, email)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}
