import { Inject, Injectable } from '@nestjs/common';
import { LoanApplicationRepositoryPort } from '../../domain/repositories/loan.repository.port';
import { LOAN_APPLICATION_REPOSITORY_PORT } from '../di-tokens';
import { LoanApplication } from '../../domain/entities/loan-application.entity';
import { LoanApplicationStatus } from '../../domain/enums/loan-application-status.enum';

export interface ListLoanApplicationsFilters {
  userId?: number; // when set, filter by applicant (admin/employee)
  status?: LoanApplicationStatus;
  limit?: number;
  offset?: number;
}

export interface ListLoanApplicationsResult {
  applications: LoanApplication[];
  total: number;
}

@Injectable()
export class ListLoanApplicationsUseCase {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY_PORT)
    private readonly loanApplicationRepository: LoanApplicationRepositoryPort,
  ) {}

  async executeForCustomer(customerId: number, filters: { status?: LoanApplicationStatus; limit?: number; offset?: number }): Promise<ListLoanApplicationsResult> {
    const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);
    const offset = Math.max(filters.offset ?? 0, 0);
    const applications = await this.loanApplicationRepository.findByUserId(customerId, {
      status: filters.status,
      limit,
      offset,
    });
    const total = await this.loanApplicationRepository.countByUserId(customerId, { status: filters.status });
    return { applications, total };
  }

  async executeForStaff(filters: ListLoanApplicationsFilters): Promise<ListLoanApplicationsResult> {
    const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);
    const offset = Math.max(filters.offset ?? 0, 0);
    const applications = await this.loanApplicationRepository.findAll({
      status: filters.status,
      userId: filters.userId,
      limit,
      offset,
    });
    const total = await this.loanApplicationRepository.countAll({
      status: filters.status,
      userId: filters.userId,
    });
    return { applications, total };
  }
}
