/**
 * Sistem deteksi spam dan flood protection untuk fitur chat
 * di Sensasiwangi
 */

import { supabase } from "../lib/supabase";

// Konfigurasi deteksi spam
const SPAM_CONFIG = {
  // Batas jumlah pesan dalam periode waktu tertentu
  MESSAGE_RATE_LIMIT: {
    MAX_MESSAGES: 10, // Maksimum 10 pesan
    TIME_WINDOW_MS: 60 * 1000, // Dalam periode 1 menit
  },
  
  // Batas jumlah pesan identik dalam periode waktu tertentu
  DUPLICATE_MESSAGE_LIMIT: {
    MAX_DUPLICATES: 3, // Maksimum 3 pesan identik
    TIME_WINDOW_MS: 5 * 60 * 1000, // Dalam periode 5 menit
  },
  
  // Batas jumlah karakter dalam satu pesan
  MAX_MESSAGE_LENGTH: 2000, // Maksimum 2000 karakter
  
  // Batas jumlah tautan dalam satu pesan
  MAX_LINKS_PER_MESSAGE: 3, // Maksimum 3 tautan
  
  // Batas jumlah mention dalam satu pesan
  MAX_MENTIONS_PER_MESSAGE: 5, // Maksimum 5 mention
};

// Cache untuk menyimpan riwayat pesan pengguna
// Format: { userId: { messages: [{ content, timestamp }], lastWarningTime: timestamp } }
const userMessageCache: Record<string, {
  messages: Array<{ content: string; timestamp: number }>;
  lastWarningTime?: number;
}> = {};

/**
 * Memeriksa apakah pesan melebihi batas panjang
 * @param content Konten pesan
 * @returns Boolean apakah pesan melebihi batas
 */
export function isMessageTooLong(content: string): boolean {
  return content.length > SPAM_CONFIG.MAX_MESSAGE_LENGTH;
}

/**
 * Menghitung jumlah tautan dalam pesan
 * @param content Konten pesan
 * @returns Jumlah tautan dalam pesan
 */
export function countLinks(content: string): number {
  // Regex untuk mendeteksi URL
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = content.match(urlRegex);
  return matches ? matches.length : 0;
}

/**
 * Menghitung jumlah mention dalam pesan
 * @param content Konten pesan
 * @returns Jumlah mention dalam pesan
 */
export function countMentions(content: string): number {
  // Regex untuk mendeteksi mention (@username)
  const mentionRegex = /@\w+/g;
  const matches = content.match(mentionRegex);
  return matches ? matches.length : 0;
}

/**
 * Memeriksa apakah pengguna mengirim pesan terlalu cepat (flood)
 * @param userId ID pengguna
 * @returns Boolean apakah pengguna melakukan flood
 */
export function isUserFlooding(userId: string): boolean {
  const now = Date.now();
  const userCache = userMessageCache[userId];
  
  if (!userCache) {
    return false;
  }
  
  // Filter pesan dalam jendela waktu
  const recentMessages = userCache.messages.filter(
    msg => (now - msg.timestamp) < SPAM_CONFIG.MESSAGE_RATE_LIMIT.TIME_WINDOW_MS
  );
  
  return recentMessages.length >= SPAM_CONFIG.MESSAGE_RATE_LIMIT.MAX_MESSAGES;
}

/**
 * Memeriksa apakah pengguna mengirim pesan duplikat
 * @param userId ID pengguna
 * @param content Konten pesan
 * @returns Boolean apakah pesan adalah duplikat
 */
export function isMessageDuplicate(userId: string, content: string): boolean {
  const now = Date.now();
  const userCache = userMessageCache[userId];
  
  if (!userCache) {
    return false;
  }
  
  // Filter pesan dalam jendela waktu
  const recentMessages = userCache.messages.filter(
    msg => (now - msg.timestamp) < SPAM_CONFIG.DUPLICATE_MESSAGE_LIMIT.TIME_WINDOW_MS
  );
  
  // Hitung jumlah pesan dengan konten yang sama
  const duplicateCount = recentMessages.filter(
    msg => msg.content === content
  ).length;
  
  return duplicateCount >= SPAM_CONFIG.DUPLICATE_MESSAGE_LIMIT.MAX_DUPLICATES;
}

/**
 * Mencatat pesan baru dari pengguna
 * @param userId ID pengguna
 * @param content Konten pesan
 */
export function recordUserMessage(userId: string, content: string): void {
  if (!userMessageCache[userId]) {
    userMessageCache[userId] = { messages: [] };
  }
  
  // Tambahkan pesan baru
  userMessageCache[userId].messages.push({
    content,
    timestamp: Date.now(),
  });
  
  // Batasi ukuran cache
  if (userMessageCache[userId].messages.length > 50) {
    userMessageCache[userId].messages = userMessageCache[userId].messages.slice(-50);
  }
}

/**
 * Mencatat peringatan spam untuk pengguna
 * @param userId ID pengguna
 */
export function recordSpamWarning(userId: string): void {
  if (!userMessageCache[userId]) {
    userMessageCache[userId] = { messages: [] };
  }
  
  userMessageCache[userId].lastWarningTime = Date.now();
}

/**
 * Memeriksa apakah pengguna baru saja mendapat peringatan
 * @param userId ID pengguna
 * @returns Boolean apakah pengguna baru saja diperingatkan
 */
export function hasRecentWarning(userId: string): boolean {
  const userCache = userMessageCache[userId];
  
  if (!userCache || !userCache.lastWarningTime) {
    return false;
  }
  
  // Periksa apakah peringatan terakhir dalam 5 menit terakhir
  return (Date.now() - userCache.lastWarningTime) < (5 * 60 * 1000);
}

/**
 * Memeriksa apakah pesan mengandung spam
 * @param userId ID pengguna
 * @param content Konten pesan
 * @returns Object berisi hasil pemeriksaan spam
 */
export function checkMessageForSpam(userId: string, content: string): {
  isSpam: boolean;
  reason?: string;
} {
  // Periksa panjang pesan
  if (isMessageTooLong(content)) {
    return {
      isSpam: true,
      reason: "message_too_long",
    };
  }
  
  // Periksa jumlah tautan
  const linkCount = countLinks(content);
  if (linkCount > SPAM_CONFIG.MAX_LINKS_PER_MESSAGE) {
    return {
      isSpam: true,
      reason: "too_many_links",
    };
  }
  
  // Periksa jumlah mention
  const mentionCount = countMentions(content);
  if (mentionCount > SPAM_CONFIG.MAX_MENTIONS_PER_MESSAGE) {
    return {
      isSpam: true,
      reason: "too_many_mentions",
    };
  }
  
  // Periksa flood
  if (isUserFlooding(userId)) {
    return {
      isSpam: true,
      reason: "flooding",
    };
  }
  
  // Periksa pesan duplikat
  if (isMessageDuplicate(userId, content)) {
    return {
      isSpam: true,
      reason: "duplicate_message",
    };
  }
  
  // Pesan tidak mengandung spam
  return { isSpam: false };
}

/**
 * Mendapatkan pesan peringatan berdasarkan alasan spam
 * @param reason Alasan spam
 * @returns Pesan peringatan
 */
export function getSpamWarningMessage(reason?: string): string {
  switch (reason) {
    case "message_too_long":
      return `Pesan terlalu panjang. Maksimum ${SPAM_CONFIG.MAX_MESSAGE_LENGTH} karakter.`;
    case "too_many_links":
      return `Terlalu banyak tautan. Maksimum ${SPAM_CONFIG.MAX_LINKS_PER_MESSAGE} tautan per pesan.`;
    case "too_many_mentions":
      return `Terlalu banyak mention. Maksimum ${SPAM_CONFIG.MAX_MENTIONS_PER_MESSAGE} mention per pesan.`;
    case "flooding":
      return `Anda mengirim pesan terlalu cepat. Harap tunggu beberapa saat sebelum mengirim pesan lagi.`;
    case "duplicate_message":
      return `Anda mengirim pesan yang sama berulang kali. Harap kirim pesan yang berbeda.`;
    default:
      return "Pesan Anda terdeteksi sebagai spam. Harap kirim pesan yang sesuai dengan pedoman komunitas.";
  }
}

/**
 * Mencatat pelanggaran spam ke database
 * @param userId ID pengguna
 * @param content Konten pesan
 * @param reason Alasan spam
 */
export async function logSpamViolation(
  userId: string,
  content: string,
  reason: string,
  conversationId: string
): Promise<void> {
  try {
    await supabase.from("spam_violations").insert({
      user_id: userId,
      message_content: content,
      reason,
      conversation_id: conversationId,
    });
  } catch (error) {
    console.error("Error logging spam violation:", error);
  }
}

/**
 * Memeriksa apakah pengguna perlu dibatasi karena pelanggaran berulang
 * @param userId ID pengguna
 * @returns Boolean apakah pengguna perlu dibatasi
 */
export async function shouldRestrictUser(userId: string): Promise<boolean> {
  try {
    // Hitung jumlah pelanggaran dalam 24 jam terakhir
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const { data, error } = await supabase
      .from("spam_violations")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", oneDayAgo.toISOString());
    
    if (error) throw error;
    
    // Jika lebih dari 5 pelanggaran dalam 24 jam, batasi pengguna
    return (data?.length || 0) >= 5;
  } catch (error) {
    console.error("Error checking user restrictions:", error);
    return false;
  }
}
