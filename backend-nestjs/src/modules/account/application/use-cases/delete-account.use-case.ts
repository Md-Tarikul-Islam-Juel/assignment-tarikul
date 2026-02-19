import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountRepositoryPort } from '../../domain/repositories/account.repository.port';
import { ACCOUNT_REPOSITORY_PORT } from '../di-tokens';
import { UNIT_OF_WORK_PORT } from '../../../../common/persistence/uow/di-tokens';
import { UnitOfWorkPort } from '../../../../common/persistence/uow/uow.port';

@Injectable()
export class DeleteAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(UNIT_OF_WORK_PORT)
    private readonly uow: UnitOfWorkPort
  ) {}

  async execute(accountId: number, hardDelete: boolean = false): Promise<void> {
    return this.uow.withTransaction(async (tx) => {
      const repo = this.accountRepository.withTx(tx);

      const account = await repo.findById(accountId);
      
      if (!account) {
        throw new NotFoundException('Account not found');
      }

      if (account.isDeleted()) {
        throw new BadRequestException('Account is already deleted');
      }

      // Check if account has zero balance before deletion
      if (account.getBalance() !== 0) {
        throw new BadRequestException('Cannot delete account with non-zero balance. Please close the account first.');
      }

      if (hardDelete) {
        await repo.hardDelete(accountId);
      } else {
        await repo.delete(accountId);
      }
    });
  }
}
