/**
 * Link Scanner untuk mendeteksi tautan berbahaya dan phishing
 * di fitur chat Sensasiwangi
 */

// Daftar domain yang diketahui berbahaya (contoh)
const KNOWN_MALICIOUS_DOMAINS = [
  "malware-site.com",
  "phishing-example.com",
  "fake-login.com",
  "suspicious-download.net",
  "free-prize-scam.com",
];

// Daftar domain yang diizinkan (whitelist)
const ALLOWED_DOMAINS = [
  "sensasiwangi.id",
  "google.com",
  "youtube.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "github.com",
  "linkedin.com",
  "tokopedia.com",
  "shopee.co.id",
  "bukalapak.com",
];

// Pola URL yang mencurigakan
const SUSPICIOUS_URL_PATTERNS = [
  /\.(tk|ml|ga|cf|gq|top)$/i, // TLD gratis yang sering disalahgunakan
  /bit\.ly|tinyurl\.com|goo\.gl|t\.co|is\.gd/i, // URL shortener
  /login|signin|account|password|secure|banking/i, // Kata kunci phishing
  /free|prize|winner|lottery|claim|reward/i, // Kata kunci scam
  /download|setup|install|update|flash/i, // Kata kunci malware
];

// Pola URL yang valid
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

/**
 * Ekstrak semua URL dari teks
 * @param text Teks yang akan diperiksa
 * @returns Array URL yang ditemukan
 */
export function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  return matches || [];
}

/**
 * Ekstrak domain dari URL
 * @param url URL yang akan diekstrak domainnya
 * @returns Domain dari URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    // Jika URL tidak valid, coba ekstrak dengan regex
    const domainMatch = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/i);
    return domainMatch ? domainMatch[1] : url;
  }
}

/**
 * Periksa apakah domain ada dalam daftar yang diketahui berbahaya
 * @param domain Domain yang akan diperiksa
 * @returns Boolean apakah domain berbahaya
 */
export function isKnownMaliciousDomain(domain: string): boolean {
  return KNOWN_MALICIOUS_DOMAINS.some(maliciousDomain => 
    domain === maliciousDomain || domain.endsWith(`.${maliciousDomain}`)
  );
}

/**
 * Periksa apakah domain ada dalam daftar yang diizinkan
 * @param domain Domain yang akan diperiksa
 * @returns Boolean apakah domain diizinkan
 */
export function isAllowedDomain(domain: string): boolean {
  return ALLOWED_DOMAINS.some(allowedDomain => 
    domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
  );
}

/**
 * Periksa apakah URL mencurigakan berdasarkan pola
 * @param url URL yang akan diperiksa
 * @returns Boolean apakah URL mencurigakan
 */
export function isSuspiciousUrl(url: string): boolean {
  return SUSPICIOUS_URL_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Periksa apakah URL menggunakan HTTPS
 * @param url URL yang akan diperiksa
 * @returns Boolean apakah URL menggunakan HTTPS
 */
export function isSecureUrl(url: string): boolean {
  return url.startsWith("https://");
}

/**
 * Periksa apakah URL adalah tautan phishing yang mencoba meniru domain terkenal
 * @param url URL yang akan diperiksa
 * @returns Boolean apakah URL adalah tautan phishing
 */
export function isLookalikePhishing(url: string): boolean {
  const domain = extractDomain(url);
  
  // Periksa domain yang mirip dengan domain terkenal
  return ALLOWED_DOMAINS.some(allowedDomain => {
    // Jika domain sama persis, bukan phishing
    if (domain === allowedDomain) return false;
    
    // Periksa domain yang mirip dengan typo
    const levenshteinDistance = calculateLevenshteinDistance(domain, allowedDomain);
    const similarityThreshold = Math.min(3, Math.floor(allowedDomain.length * 0.2));
    
    return levenshteinDistance <= similarityThreshold && levenshteinDistance > 0;
  });
}

/**
 * Hitung jarak Levenshtein antara dua string
 * @param a String pertama
 * @param b String kedua
 * @returns Jarak Levenshtein
 */
function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix = [];

  // Inisialisasi matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Isi matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Periksa semua URL dalam teks untuk mendeteksi tautan berbahaya
 * @param text Teks yang akan diperiksa
 * @returns Hasil pemeriksaan
 */
export function scanLinksInText(text: string): {
  hasMaliciousLinks: boolean;
  hasPhishingLinks: boolean;
  hasSuspiciousLinks: boolean;
  hasInsecureLinks: boolean;
  maliciousLinks: string[];
  phishingLinks: string[];
  suspiciousLinks: string[];
  insecureLinks: string[];
  allLinks: string[];
} {
  const urls = extractUrls(text);
  const maliciousLinks: string[] = [];
  const phishingLinks: string[] = [];
  const suspiciousLinks: string[] = [];
  const insecureLinks: string[] = [];
  
  urls.forEach(url => {
    const domain = extractDomain(url);
    
    // Periksa domain berbahaya
    if (isKnownMaliciousDomain(domain)) {
      maliciousLinks.push(url);
    }
    
    // Periksa domain phishing
    if (isLookalikePhishing(url)) {
      phishingLinks.push(url);
    }
    
    // Periksa URL mencurigakan
    if (isSuspiciousUrl(url) && !isAllowedDomain(domain)) {
      suspiciousLinks.push(url);
    }
    
    // Periksa URL tidak aman
    if (!isSecureUrl(url) && !url.startsWith("http://localhost")) {
      insecureLinks.push(url);
    }
  });
  
  return {
    hasMaliciousLinks: maliciousLinks.length > 0,
    hasPhishingLinks: phishingLinks.length > 0,
    hasSuspiciousLinks: suspiciousLinks.length > 0,
    hasInsecureLinks: insecureLinks.length > 0,
    maliciousLinks,
    phishingLinks,
    suspiciousLinks,
    insecureLinks,
    allLinks: urls,
  };
}

/**
 * Ganti URL berbahaya dengan peringatan
 * @param text Teks yang akan diproses
 * @param scanResult Hasil pemeriksaan tautan
 * @returns Teks dengan URL berbahaya yang diganti
 */
export function replaceMaliciousLinks(text: string, scanResult: ReturnType<typeof scanLinksInText>): string {
  let processedText = text;
  
  // Gabungkan semua tautan berbahaya
  const allMaliciousLinks = [
    ...scanResult.maliciousLinks,
    ...scanResult.phishingLinks,
    ...scanResult.suspiciousLinks,
  ];
  
  // Ganti tautan berbahaya dengan peringatan
  allMaliciousLinks.forEach(link => {
    const warningText = `[Tautan berbahaya dihapus: ${link}]`;
    processedText = processedText.replace(link, warningText);
  });
  
  return processedText;
}

/**
 * Tambahkan peringatan untuk tautan tidak aman
 * @param text Teks yang akan diproses
 * @param scanResult Hasil pemeriksaan tautan
 * @returns Teks dengan peringatan untuk tautan tidak aman
 */
export function addInsecureWarnings(text: string, scanResult: ReturnType<typeof scanLinksInText>): string {
  let processedText = text;
  
  // Tambahkan peringatan untuk tautan tidak aman
  scanResult.insecureLinks.forEach(link => {
    const warningText = `${link} [⚠️ Tautan tidak aman]`;
    processedText = processedText.replace(link, warningText);
  });
  
  return processedText;
}
