import { PasswordHasherAdapter } from './password-hasher.adapter';

describe('PasswordHasherAdapter', () => {
  let adapter: PasswordHasherAdapter;

  beforeEach(() => {
    adapter = new PasswordHasherAdapter();
  });

  describe('hash', () => {
    it('returns a string different from plain password', async () => {
      const plain = 'MyP@ssw0rd';
      const hashed = await adapter.hash(plain, 10);
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(plain);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('produces different hash each time (salt)', async () => {
      const plain = 'MyP@ssw0rd';
      const h1 = await adapter.hash(plain, 10);
      const h2 = await adapter.hash(plain, 10);
      expect(h1).not.toBe(h2);
    });
  });

  describe('compare', () => {
    it('returns true when plain matches hash', async () => {
      const plain = '12345@aA';
      const hashed = await adapter.hash(plain, 10);
      const result = await adapter.compare(plain, hashed);
      expect(result).toBe(true);
    });

    it('returns false when plain does not match hash', async () => {
      const plain = '12345@aA';
      const hashed = await adapter.hash(plain, 10);
      const result = await adapter.compare('WrongPassword', hashed);
      expect(result).toBe(false);
    });
  });

  describe('compareSync', () => {
    it('returns true when plain matches hash', async () => {
      const plain = '12345@aA';
      const hashed = await adapter.hash(plain, 10);
      expect(adapter.compareSync(plain, hashed)).toBe(true);
    });

    it('returns false when plain does not match', async () => {
      const plain = '12345@aA';
      const hashed = await adapter.hash(plain, 10);
      expect(adapter.compareSync('Wrong', hashed)).toBe(false);
    });
  });
});
