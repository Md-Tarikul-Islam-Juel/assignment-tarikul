import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  encryptSensitive,
  decryptSensitive,
  hashForLookup
} from './sensitive-data.encryption';

/**
 * Encrypts/decrypts sensitive data at rest (e.g. account numbers).
 * Uses AES-256-GCM; lookup uses HMAC-SHA256 hash.
 * Passwords are hashed with bcrypt elsewhere (see PasswordHasherAdapter).
 */
@Injectable()
export class SensitiveDataEncryptionService {
  private readonly keyHex: string;

  constructor(private readonly config: ConfigService) {
    let key = this.config.get<string>('ENCRYPTION_KEY');
    if (!key && this.config.get<string>('NODE_ENV') === 'development') {
      key = '0000000000000000000000000000000000000000000000000000000000000001';
    }
    if (!key || key.length !== 64 || !/^[0-9a-fA-F]+$/.test(key)) {
      throw new Error(
        'ENCRYPTION_KEY must be set and be a 64-character hex string (32 bytes). ' +
          'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }
    this.keyHex = key;
  }

  encrypt(plaintext: string): string {
    return encryptSensitive(plaintext, this.keyHex);
  }

  decrypt(stored: string): string {
    return decryptSensitive(stored, this.keyHex);
  }

  hashForLookup(plaintext: string): string {
    return hashForLookup(plaintext, this.keyHex);
  }
}
