import { Prisma } from '@prisma/client';
import { LoanApplication } from '../entities/loan-application.entity';
import { LoanRepayment } from '../entities/loan-repayment.entity';
import { LoanApplicationStatus } from '../enums/loan-application-status.enum';

export interface LoanApplicationRepositoryPort {
  findById(id: number): Promise<LoanApplication | null>;
  findByUserId(userId: number, filters?: { status?: LoanApplicationStatus; limit?: number; offset?: number }): Promise<LoanApplication[]>;
  countByUserId(userId: number, filters?: { status?: LoanApplicationStatus }): Promise<number>;
  findAll(filters?: { status?: LoanApplicationStatus; userId?: number; limit?: number; offset?: number }): Promise<LoanApplication[]>;
  countAll(filters?: { status?: LoanApplicationStatus; userId?: number }): Promise<number>;
  save(application: LoanApplication): Promise<LoanApplication>;
  update(application: LoanApplication): Promise<LoanApplication>;

  withTx(tx: Prisma.TransactionClient): LoanApplicationRepositoryPort;
}

export interface LoanRepaymentRepositoryPort {
  findById(id: number): Promise<LoanRepayment | null>;
  findByLoanApplicationId(loanApplicationId: number): Promise<LoanRepayment[]>;
  save(repayment: LoanRepayment): Promise<LoanRepayment>;
  saveMany(repayments: LoanRepayment[]): Promise<LoanRepayment[]>;
  update(repayment: LoanRepayment): Promise<LoanRepayment>;

  withTx(tx: Prisma.TransactionClient): LoanRepaymentRepositoryPort;
}
