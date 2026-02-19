/**
 * Account Number Value Object
 * Represents a unique account number identifier
 */
export class AccountNumber {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Account number cannot be empty');
    }
    if (value.length < 8 || value.length > 20) {
      throw new Error('Account number must be between 8 and 20 characters');
    }
    if (!/^[A-Z0-9]+$/.test(value)) {
      throw new Error('Account number must contain only uppercase letters and numbers');
    }
  }

  static create(value: string): AccountNumber {
    return new AccountNumber(value.toUpperCase().trim());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: AccountNumber): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
