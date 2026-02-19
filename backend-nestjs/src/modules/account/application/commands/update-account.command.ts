import { AccountStatus } from '../../domain/enums/account-status.enum';

export class UpdateAccountCommand {
  constructor(
    public readonly accountId: number,
    public readonly status?: AccountStatus,
    public readonly interestRate?: number,
    public readonly minimumBalance?: number,
    public readonly dailyWithdrawalLimit?: number,
    public readonly transferFeePercent?: number,
    public readonly transferFeeFixed?: number
  ) {}

  static fromDto(dto: {
    accountId: number;
    status?: AccountStatus;
    interestRate?: number;
    minimumBalance?: number;
    dailyWithdrawalLimit?: number;
    transferFeePercent?: number;
    transferFeeFixed?: number;
  }): UpdateAccountCommand {
    return new UpdateAccountCommand(
      dto.accountId,
      dto.status,
      dto.interestRate,
      dto.minimumBalance,
      dto.dailyWithdrawalLimit,
      dto.transferFeePercent,
      dto.transferFeeFixed
    );
  }
}
