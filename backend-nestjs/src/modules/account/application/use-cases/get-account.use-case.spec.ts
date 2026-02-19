import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GetAccountUseCase } from './get-account.use-case';
import { ACCOUNT_REPOSITORY_PORT } from '../di-tokens';
import { AccountRepositoryPort } from '../../domain/repositories/account.repository.port';
import { Account } from '../../domain/entities/account.entity';
import { AccountNumber } from '../../domain/value-objects/account-number.vo';
import { AccountType } from '../../domain/enums/account-type.enum';
import { Currency } from '../../domain/enums/currency.enum';
import { AccountStatus } from '../../domain/enums/account-status.enum';

function createMockAccount(overrides: { id?: number; userId?: number; deletedAt?: Date | null } = {}) {
  const id = overrides.id ?? 1;
  const userId = overrides.userId ?? 100;
  const deletedAt = overrides.deletedAt ?? null;
  return new Account(
    id,
    AccountNumber.create('ACCT12345678'),
    userId,
    AccountType.CHECKING,
    Currency.USD,
    1000,
    1000,
    AccountStatus.ACTIVE,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    deletedAt,
    new Date(),
    new Date(),
    null,
    null,
    null,
    null
  );
}

describe('GetAccountUseCase', () => {
  let useCase: GetAccountUseCase;
  let repo: jest.Mocked<AccountRepositoryPort>;

  beforeEach(async () => {
    repo = {
      findById: jest.fn(),
      findByAccountNumber: jest.fn(),
      findByAccountNumberString: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIdAndType: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      hardDelete: jest.fn(),
      updateBalance: jest.fn(),
      updateBalanceAndLastInterestCreditedAt: jest.fn(),
      findSavingsAccountsEligibleForMonthlyInterest: jest.fn(),
      updateStatus: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      withTx: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAccountUseCase,
        { provide: ACCOUNT_REPOSITORY_PORT, useValue: repo },
      ],
    }).compile();

    useCase = module.get(GetAccountUseCase);
  });

  describe('execute (by id)', () => {
    it('returns account when found and not deleted', async () => {
      const account = createMockAccount();
      repo.findById.mockResolvedValue(account);

      const result = await useCase.execute(1);
      expect(result).toBe(account);
      expect(repo.findById).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when account not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(useCase.execute(999)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(999)).rejects.toThrow('Account not found');
    });

    it('throws NotFoundException when account is soft-deleted', async () => {
      const deleted = createMockAccount({ deletedAt: new Date() });
      repo.findById.mockResolvedValue(deleted);

      await expect(useCase.execute(1)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when userId provided and does not own account', async () => {
      const account = createMockAccount({ userId: 100 });
      repo.findById.mockResolvedValue(account);

      await expect(useCase.execute(1, 200)).rejects.toThrow(NotFoundException);
    });

    it('returns account when userId provided and owns account', async () => {
      const account = createMockAccount({ userId: 100 });
      repo.findById.mockResolvedValue(account);

      const result = await useCase.execute(1, 100);
      expect(result).toBe(account);
    });
  });

  describe('executeByAccountNumber', () => {
    it('returns account when found by account number', async () => {
      const account = createMockAccount();
      repo.findByAccountNumberString.mockResolvedValue(account);

      const result = await useCase.executeByAccountNumber('ACCT12345678');
      expect(result).toBe(account);
      expect(repo.findByAccountNumberString).toHaveBeenCalledWith('ACCT12345678');
    });

    it('throws NotFoundException when account not found', async () => {
      repo.findByAccountNumberString.mockResolvedValue(null);

      await expect(useCase.executeByAccountNumber('ACCT99999999')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when userId provided and does not own account', async () => {
      const account = createMockAccount({ userId: 100 });
      repo.findByAccountNumberString.mockResolvedValue(account);

      await expect(useCase.executeByAccountNumber('ACCT12345678', 200)).rejects.toThrow(NotFoundException);
    });
  });
});
