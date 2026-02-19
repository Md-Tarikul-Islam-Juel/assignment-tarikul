import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH_BYTES = 32;
const SALT_FOR_HASH = 'account-number-lookup-v1';

/**
 * Encrypts sensitive plaintext (e.g. account number) with AES-256-GCM.
 * Returns base64(iv || authTag || ciphertext) for storage.
 * @param plaintext - Plain text to encrypt
 * @param keyHex - 32-byte key as 64-char hex string
 */
export function encryptSensitive(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error('Encryption key must be 32 bytes (64 hex characters)');
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, enc]).toString('base64');
}

/**
 * Decrypts a value produced by encryptSensitive.
 * If the value is not in the expected format (legacy plaintext), returns it as-is.
 * @param stored - base64(iv||authTag||ciphertext) or legacy plaintext
 * @param keyHex - Same key as used for encryption
 */
export function decryptSensitive(stored: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error('Encryption key must be 32 bytes (64 hex characters)');
  }
  let buf: Buffer;
  try {
    buf = Buffer.from(stored, 'base64');
  } catch {
    return stored;
  }
  if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    return stored;
  }
  try {
    const iv = buf.subarray(0, IV_LENGTH);
    const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext) + decipher.final('utf8');
  } catch {
    return stored;
  }
}

/**
 * Produces a deterministic hash for lookup (e.g. find account by number).
 * Same plaintext always yields same hash. Do not use for passwords.
 * @param plaintext - Value to hash (e.g. account number)
 * @param keyHex - Key to bind hash to this application (64 hex chars)
 */
export function hashForLookup(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  return crypto.createHmac('sha256', key).update(SALT_FOR_HASH + plaintext).digest('hex');
}

/**
 * Generates a random 32-byte key as 64-char hex (for ENCRYPTION_KEY).
 */
export function generateEncryptionKeyHex(): string {
  return crypto.randomBytes(KEY_LENGTH_BYTES).toString('hex');
}
