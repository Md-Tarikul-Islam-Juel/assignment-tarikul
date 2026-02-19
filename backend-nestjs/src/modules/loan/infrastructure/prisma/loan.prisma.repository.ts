import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { LoanApplication } from '../../domain/entities/loan-application.entity';
import { LoanRepayment } from '../../domain/entities/loan-repayment.entity';
import {
  LoanApplicationRepositoryPort,
  LoanRepaymentRepositoryPort,
} from '../../domain/repositories/loan.repository.port';
import { LoanApplicationStatus } from '../../domain/enums/loan-application-status.enum';
import { LoanPrismaMapper } from './loan.prisma.mapper';

@Injectable()
export class LoanApplicationPrismaRepository implements LoanApplicationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  withTx(tx: Prisma.TransactionClient): LoanApplicationRepositoryPort {
    return new TransactionScopedLoanApplicationRepository(tx);
  }

  async findById(id: number): Promise<LoanApplication | null> {
    const row = await this.prisma.loanApplication.findUnique({
      where: { id },
    });
    return row ? LoanPrismaMapper.applicationToDomain(row) : null;
  }

  async findByUserId(
    userId: number,
    filters?: { status?: LoanApplicationStatus; limit?: number; offset?: number },
  ): Promise<LoanApplication[]> {
    const where: Prisma.LoanApplicationWhereInput = { userId };
    if (filters?.status) where.status = filters.status;
    const rows = await this.prisma.loanApplication.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    });
    return rows.map(LoanPrismaMapper.applicationToDomain);
  }

  async countByUserId(userId: number, filters?: { status?: LoanApplicationStatus }): Promise<number> {
    const where: Prisma.LoanApplicationWhereInput = { userId };
    if (filters?.status) where.status = filters.status;
    return this.prisma.loanApplication.count({ where });
  }

  async findAll(filters?: {
    status?: LoanApplicationStatus;
    userId?: number;
    limit?: number;
    offset?: number;
  }): Promise<LoanApplication[]> {
    const where: Prisma.LoanApplicationWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.userId) where.userId = filters.userId;
    const rows = await this.prisma.loanApplication.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    });
    return rows.map(LoanPrismaMapper.applicationToDomain);
  }

  async countAll(filters?: { status?: LoanApplicationStatus; userId?: number }): Promise<number> {
    const where: Prisma.LoanApplicationWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.userId) where.userId = filters.userId;
    return this.prisma.loanApplication.count({ where });
  }

  async save(application: LoanApplication): Promise<LoanApplication> {
    const data = LoanPrismaMapper.applicationToPersistence(application) as any;
    const created = await this.prisma.loanApplication.create({
      data: {
        userId: data.userId,
        loanType: data.loanType,
        amount: data.amount,
        termMonths: data.termMonths,
        interestRate: data.interestRate,
        purpose: data.purpose,
        currency: data.currency,
        status: data.status,
        appliedAt: data.appliedAt,
        decidedAt: data.decidedAt,
        decidedByUserId: data.decidedByUserId,
        rejectionReason: data.rejectionReason,
        accountId: data.accountId,
        penaltyRatePercentPerMonth: data.penaltyRatePercentPerMonth,
      },
    });
    return LoanPrismaMapper.applicationToDomain(created);
  }

  async update(application: LoanApplication): Promise<LoanApplication> {
    const data = LoanPrismaMapper.applicationToPersistence(application) as any;
    const updated = await this.prisma.loanApplication.update({
      where: { id: application.id },
      data: {
        status: data.status,
        decidedAt: data.decidedAt,
        decidedByUserId: data.decidedByUserId,
        rejectionReason: data.rejectionReason,
        accountId: data.accountId,
        updatedAt: new Date(),
      },
    });
    return LoanPrismaMapper.applicationToDomain(updated);
  }
}

@Injectable()
export class LoanRepaymentPrismaRepository implements LoanRepaymentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  withTx(tx: Prisma.TransactionClient): LoanRepaymentRepositoryPort {
    return new TransactionScopedLoanRepaymentRepository(tx);
  }

  async findById(id: number): Promise<LoanRepayment | null> {
    const row = await this.prisma.loanRepayment.findUnique({ where: { id } });
    return row ? LoanPrismaMapper.repaymentToDomain(row) : null;
  }

  async findByLoanApplicationId(loanApplicationId: number): Promise<LoanRepayment[]> {
    const rows = await this.prisma.loanRepayment.findMany({
      where: { loanApplicationId },
      orderBy: { installmentNumber: 'asc' },
    });
    return rows.map(LoanPrismaMapper.repaymentToDomain);
  }

  async save(repayment: LoanRepayment): Promise<LoanRepayment> {
    const data = LoanPrismaMapper.repaymentToPersistence(repayment) as any;
    const created = await this.prisma.loanRepayment.create({
      data: {
        loanApplicationId: data.loanApplicationId,
        installmentNumber: data.installmentNumber,
        dueDate: data.dueDate,
        principalAmount: data.principalAmount,
        interestAmount: data.interestAmount,
        penaltyAmount: data.penaltyAmount,
        totalAmount: data.totalAmount,
        paidAt: data.paidAt,
        status: data.status,
      },
    });
    return LoanPrismaMapper.repaymentToDomain(created);
  }

  async saveMany(repayments: LoanRepayment[]): Promise<LoanRepayment[]> {
    const result: LoanRepayment[] = [];
    for (const r of repayments) {
      result.push(await this.save(r));
    }
    return result;
  }

  async update(repayment: LoanRepayment): Promise<LoanRepayment> {
    const data = LoanPrismaMapper.repaymentToPersistence(repayment) as any;
    const updated = await this.prisma.loanRepayment.update({
      where: { id: repayment.id },
      data: {
        penaltyAmount: data.penaltyAmount,
        totalAmount: data.totalAmount,
        paidAt: data.paidAt,
        status: data.status,
        updatedAt: new Date(),
      },
    });
    return LoanPrismaMapper.repaymentToDomain(updated);
  }
}

// Transaction-scoped implementations
class TransactionScopedLoanApplicationRepository implements LoanApplicationRepositoryPort {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  withTx(tx: Prisma.TransactionClient): LoanApplicationRepositoryPort {
    return new TransactionScopedLoanApplicationRepository(tx);
  }

  async findById(id: number): Promise<LoanApplication | null> {
    const row = await this.tx.loanApplication.findUnique({ where: { id } });
    return row ? LoanPrismaMapper.applicationToDomain(row) : null;
  }

  async findByUserId(
    userId: number,
    filters?: { status?: LoanApplicationStatus; limit?: number; offset?: number },
  ): Promise<LoanApplication[]> {
    const where: Prisma.LoanApplicationWhereInput = { userId };
    if (filters?.status) where.status = filters.status;
    const rows = await this.tx.loanApplication.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    });
    return rows.map(LoanPrismaMapper.applicationToDomain);
  }

  async countByUserId(userId: number, filters?: { status?: LoanApplicationStatus }): Promise<number> {
    const where: Prisma.LoanApplicationWhereInput = { userId };
    if (filters?.status) where.status = filters.status;
    return this.tx.loanApplication.count({ where });
  }

  async findAll(filters?: {
    status?: LoanApplicationStatus;
    userId?: number;
    limit?: number;
    offset?: number;
  }): Promise<LoanApplication[]> {
    const where: Prisma.LoanApplicationWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.userId) where.userId = filters.userId;
    const rows = await this.tx.loanApplication.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    });
    return rows.map(LoanPrismaMapper.applicationToDomain);
  }

  async countAll(filters?: { status?: LoanApplicationStatus; userId?: number }): Promise<number> {
    const where: Prisma.LoanApplicationWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.userId) where.userId = filters.userId;
    return this.tx.loanApplication.count({ where });
  }

  async save(application: LoanApplication): Promise<LoanApplication> {
    const data = LoanPrismaMapper.applicationToPersistence(application) as any;
    const created = await this.tx.loanApplication.create({
      data: {
        userId: data.userId,
        loanType: data.loanType,
        amount: data.amount,
        termMonths: data.termMonths,
        interestRate: data.interestRate,
        purpose: data.purpose,
        currency: data.currency,
        status: data.status,
        appliedAt: data.appliedAt,
        decidedAt: data.decidedAt,
        decidedByUserId: data.decidedByUserId,
        rejectionReason: data.rejectionReason,
        accountId: data.accountId,
        penaltyRatePercentPerMonth: data.penaltyRatePercentPerMonth,
      },
    });
    return LoanPrismaMapper.applicationToDomain(created);
  }

  async update(application: LoanApplication): Promise<LoanApplication> {
    const data = LoanPrismaMapper.applicationToPersistence(application) as any;
    const updated = await this.tx.loanApplication.update({
      where: { id: application.id },
      data: {
        status: data.status,
        decidedAt: data.decidedAt,
        decidedByUserId: data.decidedByUserId,
        rejectionReason: data.rejectionReason,
        accountId: data.accountId,
        updatedAt: new Date(),
      },
    });
    return LoanPrismaMapper.applicationToDomain(updated);
  }
}

class TransactionScopedLoanRepaymentRepository implements LoanRepaymentRepositoryPort {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  withTx(tx: Prisma.TransactionClient): LoanRepaymentRepositoryPort {
    return new TransactionScopedLoanRepaymentRepository(tx);
  }

  async findById(id: number): Promise<LoanRepayment | null> {
    const row = await this.tx.loanRepayment.findUnique({ where: { id } });
    return row ? LoanPrismaMapper.repaymentToDomain(row) : null;
  }

  async findByLoanApplicationId(loanApplicationId: number): Promise<LoanRepayment[]> {
    const rows = await this.tx.loanRepayment.findMany({
      where: { loanApplicationId },
      orderBy: { installmentNumber: 'asc' },
    });
    return rows.map(LoanPrismaMapper.repaymentToDomain);
  }

  async save(repayment: LoanRepayment): Promise<LoanRepayment> {
    const data = LoanPrismaMapper.repaymentToPersistence(repayment) as any;
    const created = await this.tx.loanRepayment.create({
      data: {
        loanApplicationId: data.loanApplicationId,
        installmentNumber: data.installmentNumber,
        dueDate: data.dueDate,
        principalAmount: data.principalAmount,
        interestAmount: data.interestAmount,
        penaltyAmount: data.penaltyAmount,
        totalAmount: data.totalAmount,
        paidAt: data.paidAt,
        status: data.status,
      },
    });
    return LoanPrismaMapper.repaymentToDomain(created);
  }

  async saveMany(repayments: LoanRepayment[]): Promise<LoanRepayment[]> {
    const result: LoanRepayment[] = [];
    for (const r of repayments) {
      result.push(await this.save(r));
    }
    return result;
  }

  async update(repayment: LoanRepayment): Promise<LoanRepayment> {
    const data = LoanPrismaMapper.repaymentToPersistence(repayment) as any;
    const updated = await this.tx.loanRepayment.update({
      where: { id: repayment.id },
      data: {
        penaltyAmount: data.penaltyAmount,
        totalAmount: data.totalAmount,
        paidAt: data.paidAt,
        status: data.status,
        updatedAt: new Date(),
      },
    });
    return LoanPrismaMapper.repaymentToDomain(updated);
  }
}
