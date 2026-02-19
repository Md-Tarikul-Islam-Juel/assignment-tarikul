import {
  encryptSensitive,
  decryptSensitive,
  hashForLookup,
  generateEncryptionKeyHex,
} from './sensitive-data.encryption';

const VALID_KEY = '0'.repeat(64); // 32 zero bytes as hex

describe('sensitive-data.encryption', () => {
  describe('encryptSensitive', () => {
    it('encrypts plaintext and returns base64 string', () => {
      const plain = 'ACCT12345678';
      const result = encryptSensitive(plain, VALID_KEY);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(Buffer.from(result, 'base64').length).toBeGreaterThan(plain.length);
    });

    it('produces different ciphertext each time (random IV)', () => {
      const plain = 'ACCT12345678';
      const r1 = encryptSensitive(plain, VALID_KEY);
      const r2 = encryptSensitive(plain, VALID_KEY);
      expect(r1).not.toBe(r2);
    });

    it('throws if key is not 64 hex characters', () => {
      expect(() => encryptSensitive('x', 'short')).toThrow('32 bytes');
      expect(() => encryptSensitive('x', 'x'.repeat(64))).toThrow();
    });
  });

  describe('decryptSensitive', () => {
    it('decrypts to original plaintext', () => {
      const plain = 'ACCT99998888';
      const encrypted = encryptSensitive(plain, VALID_KEY);
      expect(decryptSensitive(encrypted, VALID_KEY)).toBe(plain);
    });

    it('returns legacy plaintext when value is not valid base64 payload', () => {
      const legacy = 'ACCT12345678';
      expect(decryptSensitive(legacy, VALID_KEY)).toBe(legacy);
    });

    it('returns as-is when base64 decodes to too-short buffer', () => {
      const short = Buffer.from('ab').toString('base64');
      expect(decryptSensitive(short, VALID_KEY)).toBe(short);
    });

    it('throws if key is invalid', () => {
      const enc = encryptSensitive('x', VALID_KEY);
      expect(() => decryptSensitive(enc, 'bad')).toThrow('32 bytes');
    });
  });

  describe('hashForLookup', () => {
    it('returns 64-char hex string', () => {
      const hash = hashForLookup('ACCT12345678', VALID_KEY);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('is deterministic for same input', () => {
      const plain = 'ACCT12345678';
      expect(hashForLookup(plain, VALID_KEY)).toBe(hashForLookup(plain, VALID_KEY));
    });

    it('differs for different plaintext', () => {
      const h1 = hashForLookup('ACCT1111', VALID_KEY);
      const h2 = hashForLookup('ACCT2222', VALID_KEY);
      expect(h1).not.toBe(h2);
    });

    it('differs for different keys', () => {
      const plain = 'ACCT12345678';
      const otherKey = 'f'.repeat(64);
      expect(hashForLookup(plain, VALID_KEY)).not.toBe(hashForLookup(plain, otherKey));
    });
  });

  describe('generateEncryptionKeyHex', () => {
    it('returns 64-char hex string', () => {
      const key = generateEncryptionKeyHex();
      expect(key).toMatch(/^[0-9a-f]{64}$/);
    });

    it('returns different value each call', () => {
      expect(generateEncryptionKeyHex()).not.toBe(generateEncryptionKeyHex());
    });
  });
});
