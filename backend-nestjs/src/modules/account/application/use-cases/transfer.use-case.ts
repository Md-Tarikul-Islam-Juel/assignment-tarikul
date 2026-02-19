import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AccountRepositoryPort } from '../../domain/repositories/account.repository.port';
import { TransactionRepositoryPort } from '../../domain/repositories/transaction.repository.port';
import { ACCOUNT_REPOSITORY_PORT, TRANSACTION_REPOSITORY_PORT } from '../di-tokens';
import { UNIT_OF_WORK_PORT } from '../../../../common/persistence/uow/di-tokens';
import { UnitOfWorkPort } from '../../../../common/persistence/uow/uow.port';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransactionType } from '../../domain/enums/transaction-type.enum';

function generateReferenceNumber(): string {
  return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

@Injectable()
export class TransferUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(UNIT_OF_WORK_PORT)
    private readonly uow: UnitOfWorkPort
  ) {}

  async execute(
    fromAccountId: number,
    toAccountNumber: string,
    amount: number,
    description?: string
  ): Promise<{ fromAccountId: number; toAccountId: number; referenceNumber: string; fee: number }> {
    if (amount <= 0) {
      throw new BadRequestException('Transfer amount must be positive');
    }
    const toNumber = toAccountNumber?.trim();
    if (!toNumber) {
      throw new BadRequestException('Destination account number is required');
    }

    return this.uow.withTransaction(async (tx) => {
      const accountRepo = this.accountRepository.withTx(tx);
      const txRepo = this.transactionRepository.withTx(tx);

      const fromAccount = await accountRepo.findById(fromAccountId);
      if (!fromAccount || fromAccount.isDeleted()) {
        throw new NotFoundException('Source account not found');
      }

      const toAccount = await accountRepo.findByAccountNumberString(toNumber);
      if (!toAccount || toAccount.isDeleted()) {
        throw new NotFoundException('Destination account not found');
      }

      if (fromAccount.id === toAccount.id) {
        throw new BadRequestException('Cannot transfer to the same account');
      }

      if (fromAccount.currency !== toAccount.currency) {
        throw new BadRequestException('Currency mismatch. Internal transfers must be in the same currency.');
      }

      // Transfer fee from source account (real-world: fee can be % or fixed)
      let fee = 0;
      if (fromAccount.transferFeePercent != null && fromAccount.transferFeePercent > 0) {
        fee += (amount * fromAccount.transferFeePercent) / 100;
      }
      if (fromAccount.transferFeeFixed != null && fromAccount.transferFeeFixed > 0) {
        fee += fromAccount.transferFeeFixed;
      }
      fee = Math.round(fee * 100) / 100;
      const totalDebit = amount + fee;

      // Daily limit check (withdrawal + transfer out)
      const dailyLimit = fromAccount.dailyWithdrawalLimit;
      if (dailyLimit != null && dailyLimit > 0) {
        const usedToday = await txRepo.getWithdrawalSumForDay(fromAccountId, new Date());
        if (usedToday + totalDebit > dailyLimit) {
          throw new BadRequestException(
            `Daily withdrawal/transfer limit exceeded. Limit: ${dailyLimit}, used today: ${usedToday}, requested: ${totalDebit}`
          );
        }
      }

      try {
        fromAccount.withdraw(totalDebit);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Insufficient balance or account not active';
        throw new BadRequestException(message);
      }

      try {
        toAccount.deposit(amount);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Cannot deposit to destination account';
        throw new BadRequestException(message);
      }

      await accountRepo.update(fromAccount);
      await accountRepo.update(toAccount);

      const refBase = generateReferenceNumber();
      const refOut = refBase;
      const refIn = `${refBase}-IN`;

      const outTx = new Transaction(
        0,
        fromAccountId,
        TransactionType.TRANSFER_OUT,
        totalDebit,
        fromAccount.getBalance(),
        description ? `Transfer to ${toNumber}. ${description}` : `Transfer to ${toNumber}`,
        refOut,
        toAccount.id,
        null,
        fee > 0 ? { fee } : null,
        new Date()
      );
      const savedOut = await txRepo.save(outTx);

      const inTx = new Transaction(
        0,
        toAccount.id,
        TransactionType.TRANSFER_IN,
        amount,
        toAccount.getBalance(),
        description ? `Transfer from ${fromAccount.accountNumber.getValue()}. ${description}` : `Transfer from ${fromAccount.accountNumber.getValue()}`,
        refIn,
        fromAccountId,
        savedOut.id,
        null,
        new Date()
      );
      await txRepo.save(inTx);

      return {
        fromAccountId,
        toAccountId: toAccount.id,
        referenceNumber: refBase,
        fee
      };
    });
  }
}
