import { AccountType } from '../../domain/enums/account-type.enum';
import { Currency } from '../../domain/enums/currency.enum';

export class CreateAccountCommand {
  constructor(
    public readonly userId: number,
    public readonly type: AccountType,
    public readonly currency: Currency,
    public readonly interestRate?: number,
    public readonly minimumBalance?: number,
    public readonly loanAmount?: number,
    public readonly loanTermMonths?: number
  ) {}

  static fromDto(dto: {
    userId: number;
    type: AccountType;
    currency: Currency;
    interestRate?: number;
    minimumBalance?: number;
    loanAmount?: number;
    loanTermMonths?: number;
  }): CreateAccountCommand {
    return new CreateAccountCommand(
      dto.userId,
      dto.type,
      dto.currency,
      dto.interestRate,
      dto.minimumBalance,
      dto.loanAmount,
      dto.loanTermMonths
    );
  }
}
