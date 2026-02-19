import { Account as PrismaAccount, Prisma } from '@prisma/client';
import { Account } from '../../domain/entities/account.entity';
import { AccountNumber } from '../../domain/value-objects/account-number.vo';
import { AccountType } from '../../domain/enums/account-type.enum';
import { Currency } from '../../domain/enums/currency.enum';
import { AccountStatus } from '../../domain/enums/account-status.enum';

function toDecimal(value: number | null): Prisma.Decimal | null {
  if (value === null) return null;
  return new Prisma.Decimal(value);
}

function toDecimalRequired(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export class AccountPrismaMapper {
  static toDomain(prismaAccount: PrismaAccount): Account {
    return new Account(
      prismaAccount.id,
      AccountNumber.create(prismaAccount.accountNumber),
      prismaAccount.userId,
      prismaAccount.type as AccountType,
      prismaAccount.currency as Currency,
      Number(prismaAccount.balance),
      Number(prismaAccount.availableBalance),
      prismaAccount.status as AccountStatus,
      prismaAccount.interestRate ? Number(prismaAccount.interestRate) : null,
      prismaAccount.minimumBalance ? Number(prismaAccount.minimumBalance) : null,
      prismaAccount.loanAmount ? Number(prismaAccount.loanAmount) : null,
      prismaAccount.loanTermMonths,
      prismaAccount.loanStartDate,
      prismaAccount.loanEndDate,
      prismaAccount.monthlyPayment ? Number(prismaAccount.monthlyPayment) : null,
      prismaAccount.deletedAt,
      prismaAccount.createdAt,
      prismaAccount.updatedAt,
      (prismaAccount as any).dailyWithdrawalLimit != null ? Number((prismaAccount as any).dailyWithdrawalLimit) : null,
      (prismaAccount as any).transferFeePercent != null ? Number((prismaAccount as any).transferFeePercent) : null,
      (prismaAccount as any).transferFeeFixed != null ? Number((prismaAccount as any).transferFeeFixed) : null,
      (prismaAccount as any).lastInterestCreditedAt ?? null
    );
  }

  static toPersistence(domainAccount: Account): Partial<PrismaAccount> {
    return {
      id: domainAccount.id,
      accountNumber: domainAccount.accountNumber.getValue(),
      userId: domainAccount.userId,
      type: domainAccount.type,
      currency: domainAccount.currency,
      balance: toDecimalRequired(domainAccount.getBalance()),
      availableBalance: toDecimalRequired(domainAccount.getAvailableBalance()),
      status: domainAccount.getStatus(),
      interestRate: toDecimal(domainAccount.interestRate),
      minimumBalance: toDecimal(domainAccount.minimumBalance),
      loanAmount: toDecimal(domainAccount.loanAmount),
      loanTermMonths: domainAccount.loanTermMonths,
      loanStartDate: domainAccount.loanStartDate,
      loanEndDate: domainAccount.loanEndDate,
      monthlyPayment: toDecimal(domainAccount.monthlyPayment),
      deletedAt: domainAccount.deletedAt,
      createdAt: domainAccount.createdAt,
      updatedAt: domainAccount.updatedAt,
      dailyWithdrawalLimit: toDecimal(domainAccount.dailyWithdrawalLimit),
      transferFeePercent: toDecimal(domainAccount.transferFeePercent),
      transferFeeFixed: toDecimal(domainAccount.transferFeeFixed),
      lastInterestCreditedAt: domainAccount.lastInterestCreditedAt
    } as Partial<PrismaAccount>;
  }
}
