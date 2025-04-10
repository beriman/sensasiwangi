/**
 * AI Content Moderator untuk fitur chat di Sensasiwangi
 * 
 * Menggunakan OpenAI Moderation API untuk mendeteksi konten yang tidak pantas
 * https://platform.openai.com/docs/guides/moderation/overview
 */

// Tipe untuk hasil moderasi OpenAI
interface OpenAIModerationResult {
  id: string;
  model: string;
  results: Array<{
    categories: {
      sexual: boolean;
      hate: boolean;
      harassment: boolean;
      "self-harm": boolean;
      "sexual/minors": boolean;
      "hate/threatening": boolean;
      "violence/graphic": boolean;
      "self-harm/intent": boolean;
      "self-harm/instructions": boolean;
      "harassment/threatening": boolean;
      violence: boolean;
    };
    category_scores: {
      sexual: number;
      hate: number;
      harassment: number;
      "self-harm": number;
      "sexual/minors": number;
      "hate/threatening": number;
      "violence/graphic": number;
      "self-harm/intent": number;
      "self-harm/instructions": number;
      "harassment/threatening": number;
      violence: number;
    };
    flagged: boolean;
  }>;
}

// Tipe untuk hasil moderasi lokal
export interface ContentModerationResult {
  flagged: boolean;
  categories: string[];
  scores: Record<string, number>;
  moderationMethod: "openai" | "local" | "none";
}

// Konfigurasi API OpenAI
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_MODERATION_ENDPOINT = "https://api.openai.com/v1/moderations";

/**
 * Memeriksa konten menggunakan OpenAI Moderation API
 * @param content Konten yang akan diperiksa
 * @returns Hasil moderasi
 */
async function moderateWithOpenAI(content: string): Promise<ContentModerationResult> {
  try {
    // Jika tidak ada API key, gunakan moderasi lokal
    if (!OPENAI_API_KEY) {
      console.warn("OpenAI API key not found, falling back to local moderation");
      return moderateLocally(content);
    }

    const response = await fetch(OPENAI_MODERATION_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ input: content }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data: OpenAIModerationResult = await response.json();
    const result = data.results[0];

    // Konversi hasil ke format yang konsisten
    const flaggedCategories = Object.entries(result.categories)
      .filter(([_, flagged]) => flagged)
      .map(([category]) => category);

    return {
      flagged: result.flagged,
      categories: flaggedCategories,
      scores: result.category_scores,
      moderationMethod: "openai",
    };
  } catch (error) {
    console.error("Error using OpenAI moderation:", error);
    // Fallback ke moderasi lokal jika OpenAI gagal
    return moderateLocally(content);
  }
}

/**
 * Memeriksa konten menggunakan moderasi lokal sederhana
 * @param content Konten yang akan diperiksa
 * @returns Hasil moderasi
 */
function moderateLocally(content: string): ContentModerationResult {
  const lowerContent = content.toLowerCase();
  
  // Daftar kata kunci untuk berbagai kategori
  const categoryKeywords: Record<string, string[]> = {
    sexual: [
      "seks", "bokep", "porno", "telanjang", "bugil", "ml", "ngentot", 
      "kontol", "memek", "penis", "vagina", "payudara", "masturbasi"
    ],
    hate: [
      "benci", "rasis", "cina", "negro", "yahudi", "kafir", "anjing", 
      "babi", "monyet", "tolol", "idiot", "goblok", "bodoh"
    ],
    harassment: [
      "bunuh", "mati", "ancam", "serang", "perkosa", "hajar", "gebuk", 
      "hina", "caci", "maki", "bully"
    ],
    violence: [
      "bunuh", "tembak", "tikam", "bacok", "darah", "serang", "pukul", 
      "hajar", "gebuk", "tendang"
    ],
    "self-harm": [
      "bunuh diri", "suicide", "menyakiti diri", "sayat", "gantung diri", 
      "overdosis", "mati"
    ],
  };
  
  // Periksa setiap kategori
  const results: Record<string, { flagged: boolean; score: number }> = {};
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        // Tambahkan skor berdasarkan jumlah kemunculan
        const regex = new RegExp(keyword, "gi");
        const matches = lowerContent.match(regex);
        if (matches) {
          score += matches.length * 0.2;
        }
      }
    }
    
    // Normalisasi skor antara 0 dan 1
    score = Math.min(score, 1);
    
    results[category] = {
      flagged: score > 0.5, // Flagged jika skor > 0.5
      score,
    };
  }
  
  // Konversi hasil ke format yang konsisten
  const flaggedCategories = Object.entries(results)
    .filter(([_, { flagged }]) => flagged)
    .map(([category]) => category);
  
  const scores = Object.entries(results).reduce(
    (acc, [category, { score }]) => {
      acc[category] = score;
      return acc;
    },
    {} as Record<string, number>
  );
  
  return {
    flagged: flaggedCategories.length > 0,
    categories: flaggedCategories,
    scores,
    moderationMethod: "local",
  };
}

/**
 * Memeriksa konten untuk moderasi
 * @param content Konten yang akan diperiksa
 * @param useAI Apakah menggunakan AI untuk moderasi
 * @returns Hasil moderasi
 */
export async function moderateContent(
  content: string,
  useAI: boolean = true
): Promise<ContentModerationResult> {
  // Jika konten kosong, tidak perlu moderasi
  if (!content.trim()) {
    return {
      flagged: false,
      categories: [],
      scores: {},
      moderationMethod: "none",
    };
  }
  
  // Gunakan OpenAI jika diminta
  if (useAI) {
    return moderateWithOpenAI(content);
  }
  
  // Fallback ke moderasi lokal
  return moderateLocally(content);
}

/**
 * Mendapatkan pesan peringatan berdasarkan kategori yang terdeteksi
 * @param categories Kategori yang terdeteksi
 * @returns Pesan peringatan
 */
export function getModerationWarningMessage(categories: string[]): string {
  if (categories.includes("sexual") || categories.includes("sexual/minors")) {
    return "Pesan Anda terdeteksi mengandung konten seksual yang tidak pantas.";
  }
  
  if (categories.includes("hate") || categories.includes("hate/threatening")) {
    return "Pesan Anda terdeteksi mengandung ujaran kebencian.";
  }
  
  if (categories.includes("harassment") || categories.includes("harassment/threatening")) {
    return "Pesan Anda terdeteksi mengandung pelecehan atau intimidasi.";
  }
  
  if (categories.includes("violence") || categories.includes("violence/graphic")) {
    return "Pesan Anda terdeteksi mengandung konten kekerasan.";
  }
  
  if (categories.includes("self-harm") || categories.includes("self-harm/intent") || categories.includes("self-harm/instructions")) {
    return "Pesan Anda terdeteksi mengandung konten yang mendorong menyakiti diri sendiri.";
  }
  
  return "Pesan Anda terdeteksi mengandung konten yang melanggar pedoman komunitas kami.";
}
