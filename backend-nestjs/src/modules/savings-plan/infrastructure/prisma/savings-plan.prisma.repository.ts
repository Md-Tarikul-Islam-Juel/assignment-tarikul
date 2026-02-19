import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { SavingsPlan } from '../../domain/entities/savings-plan.entity';
import { SavingsPlanRepositoryPort } from '../../domain/repositories/savings-plan.repository.port';
import { SavingsPlanStatus } from '../../domain/enums/plan-status.enum';
import { SavingsPlanType } from '../../domain/enums/plan-type.enum';
import { SavingsPlanPrismaMapper } from './savings-plan.prisma.mapper';

@Injectable()
export class SavingsPlanPrismaRepository implements SavingsPlanRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  withTx(tx: Prisma.TransactionClient): SavingsPlanRepositoryPort {
    return new TransactionScopedSavingsPlanRepository(tx);
  }

  async findById(id: number): Promise<SavingsPlan | null> {
    const row = await this.prisma.savingsPlan.findUnique({ where: { id } });
    return row ? SavingsPlanPrismaMapper.toDomain(row) : null;
  }

  async findByUserId(
    userId: number,
    filters?: { status?: SavingsPlanStatus; planType?: SavingsPlanType },
  ): Promise<SavingsPlan[]> {
    const where: Prisma.SavingsPlanWhereInput = { userId };
    if (filters?.status) where.status = filters.status;
    if (filters?.planType) where.planType = filters.planType;
    const rows = await this.prisma.savingsPlan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(SavingsPlanPrismaMapper.toDomain);
  }

  async findActivePlansForInterestRun(): Promise<SavingsPlan[]> {
    const rows = await this.prisma.savingsPlan.findMany({
      where: { status: SavingsPlanStatus.ACTIVE },
      orderBy: { id: 'asc' },
    });
    return rows.map(SavingsPlanPrismaMapper.toDomain);
  }

  async findPlansMaturedBy(date: Date): Promise<SavingsPlan[]> {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const rows = await this.prisma.savingsPlan.findMany({
      where: {
        status: SavingsPlanStatus.ACTIVE,
        endDate: { lte: endOfDay },
      },
    });
    return rows.map(SavingsPlanPrismaMapper.toDomain);
  }

  async save(plan: SavingsPlan): Promise<SavingsPlan> {
    const data = SavingsPlanPrismaMapper.toPersistence(plan) as any;
    const created = await this.prisma.savingsPlan.create({
      data: {
        userId: data.userId,
        sourceAccountId: data.sourceAccountId,
        planType: data.planType,
        currency: data.currency,
        principal: data.principal,
        monthlyAmount: data.monthlyAmount,
        interestRate: data.interestRate,
        termMonths: data.termMonths,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        interestCreditedTotal: data.interestCreditedTotal,
        lastInterestCreditedAt: data.lastInterestCreditedAt,
        totalDeposited: data.totalDeposited,
        nextDueDate: data.nextDueDate,
      },
    });
    return SavingsPlanPrismaMapper.toDomain(created);
  }

  async update(plan: SavingsPlan): Promise<SavingsPlan> {
    const data = SavingsPlanPrismaMapper.toPersistence(plan) as any;
    const updated = await this.prisma.savingsPlan.update({
      where: { id: plan.id },
      data: {
        status: data.status,
        interestCreditedTotal: data.interestCreditedTotal,
        lastInterestCreditedAt: data.lastInterestCreditedAt,
        totalDeposited: data.totalDeposited,
        nextDueDate: data.nextDueDate,
        updatedAt: new Date(),
      },
    });
    return SavingsPlanPrismaMapper.toDomain(updated);
  }
}

class TransactionScopedSavingsPlanRepository implements SavingsPlanRepositoryPort {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  withTx(tx: Prisma.TransactionClient): SavingsPlanRepositoryPort {
    return new TransactionScopedSavingsPlanRepository(tx);
  }

  async findById(id: number): Promise<SavingsPlan | null> {
    const row = await this.tx.savingsPlan.findUnique({ where: { id } });
    return row ? SavingsPlanPrismaMapper.toDomain(row) : null;
  }

  async findByUserId(
    userId: number,
    filters?: { status?: SavingsPlanStatus; planType?: SavingsPlanType },
  ): Promise<SavingsPlan[]> {
    const where: Prisma.SavingsPlanWhereInput = { userId };
    if (filters?.status) where.status = filters.status;
    if (filters?.planType) where.planType = filters.planType;
    const rows = await this.tx.savingsPlan.findMany({ where, orderBy: { createdAt: 'desc' } });
    return rows.map(SavingsPlanPrismaMapper.toDomain);
  }

  async findActivePlansForInterestRun(): Promise<SavingsPlan[]> {
    const rows = await this.tx.savingsPlan.findMany({
      where: { status: SavingsPlanStatus.ACTIVE },
      orderBy: { id: 'asc' },
    });
    return rows.map(SavingsPlanPrismaMapper.toDomain);
  }

  async findPlansMaturedBy(date: Date): Promise<SavingsPlan[]> {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const rows = await this.tx.savingsPlan.findMany({
      where: { status: SavingsPlanStatus.ACTIVE, endDate: { lte: endOfDay } },
    });
    return rows.map(SavingsPlanPrismaMapper.toDomain);
  }

  async save(plan: SavingsPlan): Promise<SavingsPlan> {
    const data = SavingsPlanPrismaMapper.toPersistence(plan) as any;
    const created = await this.tx.savingsPlan.create({
      data: {
        userId: data.userId,
        sourceAccountId: data.sourceAccountId,
        planType: data.planType,
        currency: data.currency,
        principal: data.principal,
        monthlyAmount: data.monthlyAmount,
        interestRate: data.interestRate,
        termMonths: data.termMonths,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        interestCreditedTotal: data.interestCreditedTotal,
        lastInterestCreditedAt: data.lastInterestCreditedAt,
        totalDeposited: data.totalDeposited,
        nextDueDate: data.nextDueDate,
      },
    });
    return SavingsPlanPrismaMapper.toDomain(created);
  }

  async update(plan: SavingsPlan): Promise<SavingsPlan> {
    const data = SavingsPlanPrismaMapper.toPersistence(plan) as any;
    const updated = await this.tx.savingsPlan.update({
      where: { id: plan.id },
      data: {
        status: data.status,
        interestCreditedTotal: data.interestCreditedTotal,
        lastInterestCreditedAt: data.lastInterestCreditedAt,
        totalDeposited: data.totalDeposited,
        nextDueDate: data.nextDueDate,
        updatedAt: new Date(),
      },
    });
    return SavingsPlanPrismaMapper.toDomain(updated);
  }
}
