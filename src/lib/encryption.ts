/**
 * Enkripsi end-to-end untuk pesan pribadi di Sensasiwangi
 * 
 * Menggunakan Web Crypto API untuk enkripsi dan dekripsi pesan
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
 */

// Tipe untuk kunci enkripsi
interface EncryptionKey {
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}

// Tipe untuk pesan terenkripsi
interface EncryptedMessage {
  iv: string; // Initialization Vector
  encryptedData: string; // Data terenkripsi
  encryptedKey: string; // Kunci terenkripsi dengan kunci publik penerima
}

// Cache untuk menyimpan kunci pengguna
const userKeysCache: Record<string, CryptoKeyPair> = {};

/**
 * Menghasilkan pasangan kunci untuk pengguna
 * @returns Pasangan kunci (public dan private)
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  try {
    // Menghasilkan pasangan kunci RSA-OAEP
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true, // extractable
      ["encrypt", "decrypt"] // keyUsages
    );

    return keyPair;
  } catch (error) {
    console.error("Error generating key pair:", error);
    throw new Error("Gagal menghasilkan kunci enkripsi");
  }
}

/**
 * Mengekspor kunci publik dan privat ke format JSON Web Key
 * @param keyPair Pasangan kunci
 * @returns Kunci dalam format JSON Web Key
 */
export async function exportKeys(keyPair: CryptoKeyPair): Promise<EncryptionKey> {
  try {
    const publicKey = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.publicKey
    );

    const privateKey = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.privateKey
    );

    return { publicKey, privateKey };
  } catch (error) {
    console.error("Error exporting keys:", error);
    throw new Error("Gagal mengekspor kunci enkripsi");
  }
}

/**
 * Mengimpor kunci publik dari format JSON Web Key
 * @param jwk Kunci publik dalam format JSON Web Key
 * @returns Kunci publik
 */
export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  try {
    return await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
    );
  } catch (error) {
    console.error("Error importing public key:", error);
    throw new Error("Gagal mengimpor kunci publik");
  }
}

/**
 * Mengimpor kunci privat dari format JSON Web Key
 * @param jwk Kunci privat dalam format JSON Web Key
 * @returns Kunci privat
 */
export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  try {
    return await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"]
    );
  } catch (error) {
    console.error("Error importing private key:", error);
    throw new Error("Gagal mengimpor kunci privat");
  }
}

/**
 * Mengenkripsi pesan untuk penerima tertentu
 * @param message Pesan yang akan dienkripsi
 * @param recipientPublicKey Kunci publik penerima
 * @returns Pesan terenkripsi
 */
export async function encryptMessage(
  message: string,
  recipientPublicKey: CryptoKey
): Promise<EncryptedMessage> {
  try {
    // Menghasilkan kunci simetris untuk enkripsi pesan
    const aesKey = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );

    // Menghasilkan Initialization Vector (IV)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Mengenkripsi pesan dengan kunci simetris
    const encodedMessage = new TextEncoder().encode(message);
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      aesKey,
      encodedMessage
    );

    // Mengekspor kunci simetris
    const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

    // Mengenkripsi kunci simetris dengan kunci publik penerima
    const encryptedKey = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      recipientPublicKey,
      exportedAesKey
    );

    // Mengkonversi ke format string untuk penyimpanan
    return {
      iv: arrayBufferToBase64(iv),
      encryptedData: arrayBufferToBase64(encryptedData),
      encryptedKey: arrayBufferToBase64(encryptedKey),
    };
  } catch (error) {
    console.error("Error encrypting message:", error);
    throw new Error("Gagal mengenkripsi pesan");
  }
}

/**
 * Mendekripsi pesan dengan kunci privat pengguna
 * @param encryptedMessage Pesan terenkripsi
 * @param privateKey Kunci privat pengguna
 * @returns Pesan terdekripsi
 */
export async function decryptMessage(
  encryptedMessage: EncryptedMessage,
  privateKey: CryptoKey
): Promise<string> {
  try {
    // Mendekripsi kunci simetris dengan kunci privat pengguna
    const encryptedKeyBuffer = base64ToArrayBuffer(encryptedMessage.encryptedKey);
    const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      encryptedKeyBuffer
    );

    // Mengimpor kunci simetris
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      decryptedKeyBuffer,
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["decrypt"]
    );

    // Mendekripsi pesan dengan kunci simetris
    const iv = base64ToArrayBuffer(encryptedMessage.iv);
    const encryptedDataBuffer = base64ToArrayBuffer(encryptedMessage.encryptedData);
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(iv),
      },
      aesKey,
      encryptedDataBuffer
    );

    // Mengkonversi hasil dekripsi ke string
    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error("Error decrypting message:", error);
    throw new Error("Gagal mendekripsi pesan");
  }
}

/**
 * Menyimpan kunci pengguna di cache
 * @param userId ID pengguna
 * @param keyPair Pasangan kunci
 */
export function cacheUserKeys(userId: string, keyPair: CryptoKeyPair): void {
  userKeysCache[userId] = keyPair;
}

/**
 * Mendapatkan kunci pengguna dari cache
 * @param userId ID pengguna
 * @returns Pasangan kunci atau null jika tidak ditemukan
 */
export function getUserKeysFromCache(userId: string): CryptoKeyPair | null {
  return userKeysCache[userId] || null;
}

/**
 * Mengkonversi ArrayBuffer ke string Base64
 * @param buffer ArrayBuffer
 * @returns String Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Mengkonversi string Base64 ke ArrayBuffer
 * @param base64 String Base64
 * @returns ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
