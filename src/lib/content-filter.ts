/**
 * Content filter untuk mencegah kata-kata kasar dan informasi pribadi
 * dalam pesan chat di Sensasiwangi
 */

// Daftar kata-kata kasar dalam bahasa Indonesia
// Catatan: Ini hanya contoh sederhana, dalam implementasi nyata
// sebaiknya gunakan library khusus atau API moderasi konten
const badWords = [
  "anjing",
  "bangsat",
  "brengsek",
  "kampret",
  "keparat",
  "bajingan",
  "memek",
  "kontol",
  "ngentot",
  "jancok",
  "cok",
  "asu",
  "goblok",
  "tolol",
  "bodoh",
  "idiot",
  "bego",
  "monyet",
  // Tambahkan kata-kata lain sesuai kebutuhan
];

// Regex untuk mendeteksi informasi pribadi
const piiPatterns = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+62|62|0)8[1-9][0-9]{6,10}/g,
  nik: /\b[1-9][0-9]{15}\b/g, // NIK Indonesia (16 digit)
  creditCard: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
  address: /\b(jalan|jl|gg|gang|komplek|komp|perumahan|perum|blok|rt|rw|kelurahan|kecamatan|kabupaten|kota)\b.{5,}/gi,
};

/**
 * Memeriksa apakah teks mengandung kata-kata kasar
 * @param text Teks yang akan diperiksa
 * @returns Object berisi status dan kata yang terdeteksi
 */
export function containsBadWords(text: string): { found: boolean; words: string[] } {
  const lowerText = text.toLowerCase();
  const foundWords: string[] = [];

  for (const word of badWords) {
    // Cek apakah kata ada dalam teks (sebagai kata utuh, bukan bagian dari kata lain)
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(lowerText)) {
      foundWords.push(word);
    }
  }

  return {
    found: foundWords.length > 0,
    words: foundWords,
  };
}

/**
 * Menyensor kata-kata kasar dalam teks
 * @param text Teks yang akan disensor
 * @returns Teks yang sudah disensor
 */
export function censorBadWords(text: string): string {
  let censoredText = text;
  
  for (const word of badWords) {
    // Ganti kata kasar dengan bintang (*)
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    censoredText = censoredText.replace(regex, "*".repeat(word.length));
  }
  
  return censoredText;
}

/**
 * Memeriksa apakah teks mengandung informasi pribadi (PII)
 * @param text Teks yang akan diperiksa
 * @returns Object berisi status dan jenis PII yang terdeteksi
 */
export function containsPII(text: string): { found: boolean; types: string[] } {
  const detectedTypes: string[] = [];

  for (const [type, pattern] of Object.entries(piiPatterns)) {
    if (pattern.test(text)) {
      detectedTypes.push(type);
    }
  }

  return {
    found: detectedTypes.length > 0,
    types: detectedTypes,
  };
}

/**
 * Menyensor informasi pribadi dalam teks
 * @param text Teks yang akan disensor
 * @returns Teks yang sudah disensor
 */
export function censorPII(text: string): string {
  let censoredText = text;
  
  // Sensor email
  censoredText = censoredText.replace(piiPatterns.email, (match) => {
    const parts = match.split("@");
    const username = parts[0];
    const domain = parts[1];
    
    // Sensor sebagian username, tapi biarkan domain utuh
    const censoredUsername = username.charAt(0) + "*".repeat(username.length - 2) + username.charAt(username.length - 1);
    return `${censoredUsername}@${domain}`;
  });
  
  // Sensor nomor telepon
  censoredText = censoredText.replace(piiPatterns.phone, (match) => {
    // Simpan 4 digit terakhir, sensor sisanya
    return match.slice(0, 2) + "*".repeat(match.length - 6) + match.slice(-4);
  });
  
  // Sensor NIK
  censoredText = censoredText.replace(piiPatterns.nik, (match) => {
    // Sensor semua kecuali 4 digit terakhir
    return "*".repeat(match.length - 4) + match.slice(-4);
  });
  
  // Sensor kartu kredit
  censoredText = censoredText.replace(piiPatterns.creditCard, (match) => {
    // Format standar: hanya tampilkan 4 digit terakhir
    const cleaned = match.replace(/[ -]/g, "");
    return "**** **** **** " + cleaned.slice(-4);
  });
  
  // Sensor alamat (lebih kompleks, hanya sensor sebagian)
  censoredText = censoredText.replace(piiPatterns.address, (match) => {
    // Bagi alamat menjadi kata-kata
    const words = match.split(" ");
    
    // Sensor kata-kata yang mungkin spesifik (nomor rumah, nama jalan, dll)
    const censoredWords = words.map((word, index) => {
      // Biarkan kata kunci alamat (jalan, gang, dll) dan kata pendek
      if (index === 0 || word.length < 3) {
        return word;
      }
      
      // Sensor kata-kata yang mungkin spesifik
      if (/\d/.test(word) || word.length > 3) {
        return "*".repeat(word.length);
      }
      
      return word;
    });
    
    return censoredWords.join(" ");
  });
  
  return censoredText;
}

/**
 * Memeriksa dan menyensor konten pesan
 * @param text Teks pesan yang akan diperiksa
 * @returns Object berisi hasil pemeriksaan dan teks yang disensor
 */
export function filterMessageContent(text: string): {
  hasBadWords: boolean;
  hasPII: boolean;
  filteredText: string;
  badWords: string[];
  piiTypes: string[];
} {
  const badWordsCheck = containsBadWords(text);
  const piiCheck = containsPII(text);
  
  // Sensor konten jika diperlukan
  let filteredText = text;
  
  if (badWordsCheck.found) {
    filteredText = censorBadWords(filteredText);
  }
  
  if (piiCheck.found) {
    filteredText = censorPII(filteredText);
  }
  
  return {
    hasBadWords: badWordsCheck.found,
    hasPII: piiCheck.found,
    filteredText,
    badWords: badWordsCheck.words,
    piiTypes: piiCheck.types,
  };
}
