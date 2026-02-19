import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { SensitiveDataEncryptionService } from '../../../../common/encryption/sensitive-data.encryption.service';
import { Account } from '../../domain/entities/account.entity';
import { AccountRepositoryPort } from '../../domain/repositories/account.repository.port';
import { AccountNumber } from '../../domain/value-objects/account-number.vo';
import { AccountType } from '../../domain/enums/account-type.enum';
import { AccountStatus } from '../../domain/enums/account-status.enum';
import { AccountPrismaMapper } from './account.prisma.mapper';

type AccountRow = Prisma.AccountGetPayload<object> & { accountNumberHash?: string | null };

@Injectable()
export class AccountPrismaRepository implements AccountRepositoryPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: SensitiveDataEncryptionService
  ) {}

  withTx(tx: Prisma.TransactionClient): AccountRepositoryPort {
    return new TransactionScopedAccountRepository(tx, this.encryption);
  }

  private decryptRow(row: AccountRow): AccountRow {
    const plain = this.encryption.decrypt(row.accountNumber);
    return { ...row, accountNumber: plain };
  }

  private async backfillIfNeeded(row: AccountRow): Promise<void> {
    if ((row as AccountRow).accountNumberHash != null) return;
    const plain = this.encryption.decrypt(row.accountNumber);
    const encrypted = this.encryption.encrypt(plain);
    const hash = this.encryption.hashForLookup(plain);
    await this.prisma.account.update({
      where: { id: row.id },
      data: { accountNumber: encrypted, accountNumberHash: hash } as any
    });
  }

  async findById(id: number): Promise<Account | null> {
    const row = await this.prisma.account.findFirst({
      where: { id, deletedAt: null }
    });
    if (!row) return null;
    await this.backfillIfNeeded(row as AccountRow);
    const decrypted = this.decryptRow(row as AccountRow);
    return AccountPrismaMapper.toDomain(decrypted);
  }

  async findByAccountNumber(accountNumber: AccountNumber): Promise<Account | null> {
    return this.findByAccountNumberString(accountNumber.getValue());
  }

  async findByAccountNumberString(accountNumber: string): Promise<Account | null> {
    const normalized = accountNumber.trim().toUpperCase();
    const hash = this.encryption.hashForLookup(normalized);
    let row = await this.prisma.account.findFirst({
      where: { accountNumberHash: hash, deletedAt: null } as any
    });
    if (!row) {
      const legacy = await this.prisma.account.findMany({
        where: { deletedAt: null, accountNumberHash: null } as any
      });
      for (const r of legacy) {
        const plain = this.encryption.decrypt((r as AccountRow).accountNumber);
        if (plain === normalized) {
          await this.backfillIfNeeded(r as AccountRow);
          row = await this.prisma.account.findFirst({
            where: { id: r.id }
          });
          break;
        }
      }
    }
    if (!row) return null;
    await this.backfillIfNeeded(row as AccountRow);
    const decrypted = this.decryptRow(row as AccountRow);
    return AccountPrismaMapper.toDomain(decrypted);
  }

  async findByUserId(userId: number): Promise<Account[]> {
    const rows = await this.prisma.account.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });
    for (const r of rows) await this.backfillIfNeeded(r as AccountRow);
    return rows.map((r) => AccountPrismaMapper.toDomain(this.decryptRow(r as AccountRow)));
  }

  async findByUserIdAndType(userId: number, type: AccountType): Promise<Account[]> {
    const rows = await this.prisma.account.findMany({
      where: { userId, type, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });
    for (const r of rows) await this.backfillIfNeeded(r as AccountRow);
    return rows.map((r) => AccountPrismaMapper.toDomain(this.decryptRow(r as AccountRow)));
  }

  async save(account: Account): Promise<Account> {
    const data = AccountPrismaMapper.toPersistence(account);
    const plain = data.accountNumber!;
    const accountNumber = this.encryption.encrypt(plain);
    const accountNumberHash = this.encryption.hashForLookup(plain);
    const prismaAccount = await this.prisma.account.create({
      data: {
        accountNumber,
        accountNumberHash,
        userId: data.userId!,
        type: data.type!,
        currency: data.currency!,
        balance: data.balance!,
        availableBalance: data.availableBalance!,
        status: data.status!,
        interestRate: data.interestRate,
        minimumBalance: data.minimumBalance,
        loanAmount: data.loanAmount,
        loanTermMonths: data.loanTermMonths,
        loanStartDate: data.loanStartDate,
        loanEndDate: data.loanEndDate,
        monthlyPayment: data.monthlyPayment,
        deletedAt: null
      } as any
    });
    return AccountPrismaMapper.toDomain(this.decryptRow(prismaAccount as AccountRow));
  }

  async update(account: Account): Promise<Account> {
    const data = AccountPrismaMapper.toPersistence(account) as Record<string, unknown>;
    const prismaAccount = await this.prisma.account.update({
      where: { id: account.id },
      data: {
        balance: data.balance,
        availableBalance: data.availableBalance,
        status: data.status,
        interestRate: data.interestRate,
        minimumBalance: data.minimumBalance,
        dailyWithdrawalLimit: data.dailyWithdrawalLimit,
        transferFeePercent: data.transferFeePercent,
        transferFeeFixed: data.transferFeeFixed,
        updatedAt: new Date()
      } as any
    });
    return AccountPrismaMapper.toDomain(this.decryptRow(prismaAccount as AccountRow));
  }

  async delete(id: number): Promise<void> {
    await this.prisma.account.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    });
  }

  async hardDelete(id: number): Promise<void> {
    await this.prisma.account.delete({
      where: { id }
    });
  }

  async updateBalance(id: number, balance: number, availableBalance: number): Promise<Account> {
    const prismaAccount = await this.prisma.account.update({
      where: { id },
      data: { balance, availableBalance, updatedAt: new Date() } as any
    });
    return AccountPrismaMapper.toDomain(this.decryptRow(prismaAccount as AccountRow));
  }

  async updateBalanceAndLastInterestCreditedAt(id: number, balance: number, availableBalance: number, lastInterestCreditedAt: Date): Promise<Account> {
    const prismaAccount = await this.prisma.account.update({
      where: { id },
      data: { balance, availableBalance, lastInterestCreditedAt, updatedAt: new Date() } as any
    });
    return AccountPrismaMapper.toDomain(this.decryptRow(prismaAccount as AccountRow));
  }

  async findSavingsAccountsEligibleForMonthlyInterest(asOf: Date): Promise<Account[]> {
    const startOfMonth = new Date(asOf.getFullYear(), asOf.getMonth(), 1);
    const where = {
      deletedAt: null,
      type: AccountType.SAVINGS,
      interestRate: { not: null, gt: 0 },
      OR: [
        { lastInterestCreditedAt: null },
        { lastInterestCreditedAt: { lt: startOfMonth } }
      ]
    };
    const rows = await this.prisma.account.findMany({
      where: where as Prisma.AccountWhereInput,
      orderBy: { id: 'asc' }
    });
    for (const r of rows) await this.backfillIfNeeded(r as AccountRow);
    return rows.map((r) => AccountPrismaMapper.toDomain(this.decryptRow(r as AccountRow)));
  }

  async updateStatus(id: number, status: AccountStatus): Promise<Account> {
    const prismaAccount = await this.prisma.account.update({
      where: { id },
      data: { status, updatedAt: new Date() } as any
    });
    return AccountPrismaMapper.toDomain(this.decryptRow(prismaAccount as AccountRow));
  }

  async findAll(filters?: {
    userId?: number;
    type?: AccountType;
    status?: AccountStatus;
    limit?: number;
    offset?: number;
  }): Promise<Account[]> {
    const where: Prisma.AccountWhereInput = {
      deletedAt: null
    };

    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    const rows = await this.prisma.account.findMany({
      where,
      take: filters?.limit,
      skip: filters?.offset,
      orderBy: { createdAt: 'desc' }
    });
    for (const r of rows) await this.backfillIfNeeded(r as AccountRow);
    return rows.map((r) => AccountPrismaMapper.toDomain(this.decryptRow(r as AccountRow)));
  }

  async count(filters?: {
    userId?: number;
    type?: AccountType;
    status?: AccountStatus;
  }): Promise<number> {
    const where: Prisma.AccountWhereInput = {
      deletedAt: null
    };

    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.account.count({ where });
  }
}

class TransactionScopedAccountRepository implements AccountRepositoryPort {
  constructor(
    private readonly tx: Prisma.TransactionClient,
    private readonly encryption: SensitiveDataEncryptionService
  ) {}

  withTx(tx: Prisma.TransactionClient): AccountRepositoryPort {
    return new TransactionScopedAccountRepository(tx, this.encryption);
  }

  private decryptRow(row: AccountRow): AccountRow {
    const plain = this.encryption.decrypt(row.accountNumber);
    return { ...row, accountNumber: plain };
  }

  private async backfillIfNeeded(row: AccountRow): Promise<void> {
    if ((row as AccountRow).accountNumberHash != null) return;
    const plain = this.encryption.decrypt(row.accountNumber);
    const encrypted = this.encryption.encrypt(plain);
    const hash = this.encryption.hashForLookup(plain);
    await this.tx.account.update({
      where: { id: row.id },
      data: { accountNumber: encrypted, accountNumberHash: hash } as any
    });
  }

  async findById(id: number): Promise<Account | null> {
    const row = await this.tx.account.findFirst({ where: { id, deletedAt: null } });
    if (!row) return null;
    await this.backfillIfNeeded(row as AccountRow);
    const decrypted = this.decryptRow(row as AccountRow);
    return AccountPrismaMapper.toDomain(decrypted);
  }

  async findByAccountNumber(accountNumber: AccountNumber): Promise<Account | null> {
    return this.findByAccountNumberString(accountNumber.getValue());
  }

  async findByAccountNumberString(accountNumber: string): Promise<Account | null> {
    const normalized = accountNumber.trim().toUpperCase();
    const hash = this.encryption.hashForLookup(normalized);
    let row = await this.tx.account.findFirst({
      where: { accountNumberHash: hash, deletedAt: null } as any
    });
    if (!row) {
      const legacy = await this.tx.account.findMany({
        where: { deletedAt: null, accountNumberHash: null } as any
      });
      for (const r of legacy) {
        const plain = this.encryption.decrypt((r as AccountRow).accountNumber);
        if (plain === normalized) {
          await this.backfillIfNeeded(r as AccountRow);
          row = await this.tx.account.findFirst({ where: { id: r.id } });
          break;
        }
      }
    }
    if (!row) return null;
    await this.backfillIfNeeded(row as AccountRow);
    const decrypted = this.decryptRow(row as AccountRow);
    return AccountPrismaMapper.toDomain(decrypted);
  }

  async findByUserId(userId: number): Promise<Account[]> {
    const rows = await this.tx.account.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });
    return rows.map((r) => AccountPrismaMapper.toDomain(this.decryptRow(r as AccountRow)));
  }

  async findByUserIdAndType(userId: number, type: AccountType): Promise<Account[]> {
    const rows = await this.tx.account.findMany({
      where: { userId, type, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });
    return rows.map((r) => AccountPrismaMapper.toDomain(this.decryptRow(r as AccountRow)));
  }

  async save(account: Account): Promise<Account> {
    const data = AccountPrismaMapper.toPersistence(account);
    const plain = data.accountNumber!;
    const accountNumber = this.encryption.encrypt(plain);
    const accountNumberHash = this.encryption.hashForLookup(plain);
    const prismaAccount = await this.tx.account.create({
      data: {
        accountNumber,
        accountNumberHash,
        userId: data.userId!,
        type: data.type!,
        currency: data.currency!,
        balance: data.balance!,
        availableBalance: data.availableBalance!,
        status: data.status!,
        interestRate: data.interestRate,
        minimumBalance: data.minimumBalance,
        loanAmount: data.loanAmount,
        loanTermMonths: data.loanTermMonths,
        loanStartDate: data.loanStartDate,
        loanEndDate: data.loanEndDate,
        monthlyPayment: data.monthlyPayment,
        deletedAt: null
      } as any
    });
    return AccountPrismaMapper.toDomain(this.decryptRow(prismaAccount as AccountRow));
  }

  async update(account: Account): Promise<Account> {
    const data = AccountPrismaMapper.toPersistence(account) as Record<string, unknown>;
    const prismaAccount = await this.tx.account.update({
      where: { id: account.id },
      data: {
        balance: data.balance,
        availableBalance: data.availableBalance,
        status: data.status,
        interestRate: data.interestRate,
        minimumBalance: data.minimumBalance,
        dailyWithdrawalLimit: data.dailyWithdrawalLimit,
        transferFeePercent: data.transferFeePercent,
        transferFeeFixed: data.transferFeeFixed,
        updatedAt: new Date()
      } as any
    });
    return AccountPrismaMapper.toDomain(this.decryptRow(prismaAccount as AccountRow));
  }

  async delete(id: number): Promise<void> {
    await this.tx.account.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async hardDelete(id: number): Promise<void> {
    await this.tx.account.delete({ where: { id } });
  }

  async updateBalance(id: number, balance: number, availableBalance: number): Promise<Account> {
    const prismaAccount = await this.tx.account.update({
      where: { id },
      data: { balance, availableBalance, updatedAt: new Date() } as any
    });
    return AccountPrismaMapper.toDomain(this.decryptRow(prismaAccount as AccountRow));
  }

  async updateBalanceAndLastInterestCreditedAt(id: number, balance: number, availableBalance: number, lastInterestCreditedAt: Date): Promise<Account> {
    const prismaAccount = await this.tx.account.update({
      where: { id },
      data: { balance, availableBalance, lastInterestCreditedAt, updatedAt: new Date() } as any
    });
    return AccountPrismaMapper.toDomain(this.decryptRow(prismaAccount as AccountRow));
  }

  async findSavingsAccountsEligibleForMonthlyInterest(asOf: Date): Promise<Account[]> {
    const startOfMonth = new Date(asOf.getFullYear(), asOf.getMonth(), 1);
    const where = {
      deletedAt: null,
      type: AccountType.SAVINGS,
      interestRate: { not: null, gt: 0 },
      OR: [
        { lastInterestCreditedAt: null },
        { lastInterestCreditedAt: { lt: startOfMonth } }
      ]
    };
    const rows = await this.tx.account.findMany({
      where: where as Prisma.AccountWhereInput,
      orderBy: { id: 'asc' }
    });
    return rows.map((r) => AccountPrismaMapper.toDomain(this.decryptRow(r as AccountRow)));
  }

  async updateStatus(id: number, status: AccountStatus): Promise<Account> {
    const prismaAccount = await this.tx.account.update({
      where: { id },
      data: { status, updatedAt: new Date() } as any
    });
    return AccountPrismaMapper.toDomain(this.decryptRow(prismaAccount as AccountRow));
  }

  async findAll(filters?: {
    userId?: number;
    type?: AccountType;
    status?: AccountStatus;
    limit?: number;
    offset?: number;
  }): Promise<Account[]> {
    const where: Prisma.AccountWhereInput = { deletedAt: null };
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;

    const rows = await this.tx.account.findMany({
      where,
      take: filters?.limit,
      skip: filters?.offset,
      orderBy: { createdAt: 'desc' }
    });
    return rows.map((r) => AccountPrismaMapper.toDomain(this.decryptRow(r as AccountRow)));
  }

  async count(filters?: {
    userId?: number;
    type?: AccountType;
    status?: AccountStatus;
  }): Promise<number> {
    const where: Prisma.AccountWhereInput = { deletedAt: null };
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    return this.tx.account.count({ where });
  }
}
