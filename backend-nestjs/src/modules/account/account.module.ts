import { Module } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { PlatformJwtModule } from '../../platform/jwt/jwt.module';
import { UNIT_OF_WORK_PORT } from '../../common/persistence/uow/di-tokens';
import { PrismaUnitOfWork } from '../auth/infrastructure/uow/prisma.uow';
import { AuthModule } from '../auth/auth.module';
import { ACCOUNT_REPOSITORY_PORT, TRANSACTION_REPOSITORY_PORT } from './application/di-tokens';
import { AccountService } from './application/services/account.service';
import { CreateAccountUseCase } from './application/use-cases/create-account.use-case';
import { GetAccountUseCase } from './application/use-cases/get-account.use-case';
import { ListAccountsUseCase } from './application/use-cases/list-accounts.use-case';
import { UpdateAccountUseCase } from './application/use-cases/update-account.use-case';
import { DeleteAccountUseCase } from './application/use-cases/delete-account.use-case';
import { GetAccountHistoryUseCase } from './application/use-cases/get-account-history.use-case';
import { DepositUseCase } from './application/use-cases/deposit.use-case';
import { WithdrawUseCase } from './application/use-cases/withdraw.use-case';
import { TransferUseCase } from './application/use-cases/transfer.use-case';
import { AccountPrismaRepository } from './infrastructure/prisma/account.prisma.repository';
import { TransactionPrismaRepository } from './infrastructure/prisma/transaction.prisma.repository';
import { AccountController } from './interface/http/account.controller';

@Module({
  imports: [PrismaModule, AuthModule, PlatformJwtModule],
  controllers: [AccountController],
  providers: [
    // Application Services
    AccountService,
    // Use Cases
    CreateAccountUseCase,
    GetAccountUseCase,
    ListAccountsUseCase,
    UpdateAccountUseCase,
    DeleteAccountUseCase,
    GetAccountHistoryUseCase,
    DepositUseCase,
    WithdrawUseCase,
    TransferUseCase,
    // Infrastructure Repositories
    {
      provide: ACCOUNT_REPOSITORY_PORT,
      useClass: AccountPrismaRepository
    },
    AccountPrismaRepository,
    {
      provide: TRANSACTION_REPOSITORY_PORT,
      useClass: TransactionPrismaRepository
    },
    TransactionPrismaRepository,
    // Unit of Work
    {
      provide: UNIT_OF_WORK_PORT,
      useClass: PrismaUnitOfWork
    },
    PrismaUnitOfWork
  ],
  exports: [AccountService, ACCOUNT_REPOSITORY_PORT, TRANSACTION_REPOSITORY_PORT, UNIT_OF_WORK_PORT]
})
export class AccountModule {}
