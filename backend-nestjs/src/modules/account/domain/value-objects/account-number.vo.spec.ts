import { AccountNumber } from './account-number.vo';

describe('AccountNumber', () => {
  describe('create', () => {
    it('creates with valid value and normalizes to uppercase', () => {
      const vo = AccountNumber.create('acct12345678');
      expect(vo.getValue()).toBe('ACCT12345678');
    });

    it('trims whitespace', () => {
      const vo = AccountNumber.create('  ACCT12345678  ');
      expect(vo.getValue()).toBe('ACCT12345678');
    });

    it('accepts 8 chars', () => {
      expect(AccountNumber.create('ACCT1234').getValue()).toBe('ACCT1234');
    });

    it('accepts 20 chars', () => {
      const long = 'A'.repeat(20);
      expect(AccountNumber.create(long).getValue()).toBe(long);
    });

    it('throws when empty', () => {
      expect(() => AccountNumber.create('')).toThrow('cannot be empty');
      expect(() => AccountNumber.create('   ')).toThrow('cannot be empty');
    });

    it('throws when too short', () => {
      expect(() => AccountNumber.create('ACCT123')).toThrow('between 8 and 20');
    });

    it('throws when too long', () => {
      expect(() => AccountNumber.create('A'.repeat(21))).toThrow('between 8 and 20');
    });

    it('throws when contains invalid characters', () => {
      expect(() => AccountNumber.create('ACCT1234-56')).toThrow('uppercase letters and numbers');
      expect(() => AccountNumber.create('ACCT1234 56')).toThrow('uppercase letters and numbers');
    });
  });

  describe('equals', () => {
    it('returns true for same value', () => {
      const a = AccountNumber.create('ACCT12345678');
      const b = AccountNumber.create('ACCT12345678');
      expect(a.equals(b)).toBe(true);
    });

    it('returns false for different value', () => {
      const a = AccountNumber.create('ACCT11111111');
      const b = AccountNumber.create('ACCT22222222');
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('toString', () => {
    it('returns the value', () => {
      const vo = AccountNumber.create('ACCT12345678');
      expect(vo.toString()).toBe('ACCT12345678');
    });
  });
});
