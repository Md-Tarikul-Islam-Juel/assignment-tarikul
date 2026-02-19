import {BadRequestException, Inject, Injectable, NotFoundException} from '@nestjs/common';
import {UNIT_OF_WORK_PORT} from '../../../../common/persistence/uow/di-tokens';
import {UnitOfWorkPort} from '../../../../common/persistence/uow/uow.port';
import {Account} from '../../domain/entities/account.entity';
import {AccountRepositoryPort} from '../../domain/repositories/account.repository.port';
import {UpdateAccountCommand} from '../commands/update-account.command';
import {ACCOUNT_REPOSITORY_PORT} from '../di-tokens';

@Injectable()
export class UpdateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(UNIT_OF_WORK_PORT)
    private readonly uow: UnitOfWorkPort
  ) {}

  async execute(command: UpdateAccountCommand): Promise<Account> {
    return this.uow.withTransaction(async tx => {
      const repo = this.accountRepository.withTx(tx);

      const account = await repo.findById(command.accountId);

      if (!account || account.isDeleted()) {
        throw new NotFoundException('Account not found');
      }

      let updatedAccount = account;

      // Update status if provided
      if (command.status) {
        if (command.status === 'FROZEN' && account.isActive()) {
          updatedAccount = account.freeze();
        } else if (command.status === 'ACTIVE' && account.isFrozen()) {
          updatedAccount = account.unfreeze();
        } else if (command.status === 'CLOSED') {
          try {
            updatedAccount = account.close();
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Cannot close account.';
            throw new BadRequestException(message);
          }
        } else {
          // For other status changes, create new instance
          updatedAccount = new Account(
            account.id,
            account.accountNumber,
            account.userId,
            account.type,
            account.currency,
            account.getBalance(),
            account.getAvailableBalance(),
            command.status,
            command.interestRate ?? account.interestRate,
            command.minimumBalance ?? account.minimumBalance,
            account.loanAmount,
            account.loanTermMonths,
            account.loanStartDate,
            account.loanEndDate,
            account.monthlyPayment,
            account.deletedAt,
            account.createdAt,
            new Date(),
            command.dailyWithdrawalLimit ?? account.dailyWithdrawalLimit,
            command.transferFeePercent ?? account.transferFeePercent,
            command.transferFeeFixed ?? account.transferFeeFixed
          );
        }
      } else {
        // Update other fields without changing status
        updatedAccount = new Account(
          account.id,
          account.accountNumber,
          account.userId,
          account.type,
          account.currency,
          account.getBalance(),
          account.getAvailableBalance(),
          account.getStatus(),
          command.interestRate ?? account.interestRate,
          command.minimumBalance ?? account.minimumBalance,
          account.loanAmount,
          account.loanTermMonths,
          account.loanStartDate,
          account.loanEndDate,
          account.monthlyPayment,
          account.deletedAt,
          account.createdAt,
          new Date(),
          command.dailyWithdrawalLimit ?? account.dailyWithdrawalLimit,
          command.transferFeePercent ?? account.transferFeePercent,
          command.transferFeeFixed ?? account.transferFeeFixed
        );
      }

      return repo.update(updatedAccount);
    });
  }
}
