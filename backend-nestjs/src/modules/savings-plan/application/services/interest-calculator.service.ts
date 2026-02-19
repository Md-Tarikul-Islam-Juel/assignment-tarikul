import { Injectable } from '@nestjs/common';

/**
 * Real-world interest calculation engine.
 * - Monthly: balance * (annualRate/12) / 100
 * - Yearly: balance * annualRate / 100
 * - Simple interest for a period: P * R * T (T in years or as fraction of year)
 */
@Injectable()
export class InterestCalculatorService {
  /**
   * Monthly interest (simple): amount * (annualRatePercent / 12) / 100
   */
  calculateMonthlyInterest(balance: number, annualRatePercent: number): number {
    if (annualRatePercent <= 0) return 0;
    return Math.round((balance * (annualRatePercent / 12) / 100) * 100) / 100;
  }

  /**
   * Yearly interest: amount * annualRatePercent / 100
   */
  calculateYearlyInterest(balance: number, annualRatePercent: number): number {
    if (annualRatePercent <= 0) return 0;
    return Math.round((balance * annualRatePercent / 100) * 100) / 100;
  }

  /**
   * Simple interest for a period: principal * rate/100 * (months/12)
   */
  calculateSimpleInterestForMonths(principal: number, annualRatePercent: number, months: number): number {
    if (annualRatePercent <= 0 || months <= 0) return 0;
    return Math.round((principal * (annualRatePercent / 100) * (months / 12)) * 100) / 100;
  }

  /**
   * Compound interest (e.g. for FD): A = P * (1 + r/n)^(n*t)
   * For monthly compounding over termMonths: A = P * (1 + annualRate/12/100)^termMonths
   */
  calculateMaturityAmountCompound(principal: number, annualRatePercent: number, termMonths: number): number {
    if (annualRatePercent <= 0) return principal;
    const r = annualRatePercent / 12 / 100;
    return Math.round(principal * Math.pow(1 + r, termMonths) * 100) / 100;
  }
}
