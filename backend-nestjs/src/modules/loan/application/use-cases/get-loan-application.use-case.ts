import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LoanApplicationRepositoryPort } from '../../domain/repositories/loan.repository.port';
import { LOAN_APPLICATION_REPOSITORY_PORT } from '../di-tokens';
import { LoanApplication } from '../../domain/entities/loan-application.entity';

@Injectable()
export class GetLoanApplicationUseCase {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY_PORT)
    private readonly loanApplicationRepository: LoanApplicationRepositoryPort,
  ) {}

  async execute(applicationId: number, userId?: number): Promise<LoanApplication> {
    const application = await this.loanApplicationRepository.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Loan application not found');
    }
    if (userId != null && application.userId !== userId) {
      throw new NotFoundException('Loan application not found');
    }
    return application;
  }
}
