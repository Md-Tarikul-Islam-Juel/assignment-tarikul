import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import type {
  MonthlyStatementResponse,
  AccountSummaryReportResponse,
  LoanBalancesReportResponse,
  TransactionHistoryReportResponse,
} from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private api: ApiService) {}

  getMonthlyStatement(accountId: number, year: number, month: number) {
    return this.api.get<MonthlyStatementResponse>('/reports/statements/monthly', {
      accountId: String(accountId),
      year: String(year),
      month: String(month),
    });
  }

  getAccountSummary(userId?: number) {
    const params: Record<string, string> = {};
    if (userId != null) params['userId'] = String(userId);
    return this.api.get<AccountSummaryReportResponse>('/reports/account-summary', params);
  }

  getLoanBalances(userId?: number) {
    const params: Record<string, string> = {};
    if (userId != null) params['userId'] = String(userId);
    return this.api.get<LoanBalancesReportResponse>('/reports/loan-balances', params);
  }

  getTransactionHistory(
    accountId: number,
    params?: { startDate?: string; endDate?: string; limit?: number; offset?: number }
  ) {
    const q: Record<string, string | number> = { accountId: String(accountId) };
    if (params?.startDate) q['startDate'] = params.startDate;
    if (params?.endDate) q['endDate'] = params.endDate;
    if (params?.limit != null) q['limit'] = params.limit;
    if (params?.offset != null) q['offset'] = params.offset;
    return this.api.get<TransactionHistoryReportResponse>('/reports/transaction-history', q);
  }
}
