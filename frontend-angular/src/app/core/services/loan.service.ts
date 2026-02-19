import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import type {
  LoanApplication,
  LoanRepaymentScheduleItem,
  ApplyLoanRequest,
  ListLoanApplicationsResponse,
  GetLoanApplicationResponse,
  GetRepaymentScheduleResponse,
} from '../models/loan.model';

@Injectable({ providedIn: 'root' })
export class LoanService {
  constructor(private api: ApiService) {}

  apply(body: ApplyLoanRequest) {
    return this.api.post<{ success: boolean; data: LoanApplication; message: string }>('/loans/applications', body);
  }

  list(params?: { status?: string; userId?: number; limit?: number; offset?: number }) {
    const q: Record<string, string | number> = {};
    if (params?.status) q['status'] = params.status;
    if (params?.userId != null) q['userId'] = params.userId;
    if (params?.limit != null) q['limit'] = params.limit;
    if (params?.offset != null) q['offset'] = params.offset;
    return this.api.get<ListLoanApplicationsResponse>('/loans/applications', q);
  }

  getById(id: number) {
    return this.api.get<GetLoanApplicationResponse>(`/loans/applications/${id}`);
  }

  approve(id: number, interestRate: number) {
    return this.api.post<{ success: boolean; data: LoanApplication; message: string }>(`/loans/applications/${id}/approve`, { interestRate });
  }

  reject(id: number, rejectionReason?: string) {
    return this.api.post<{ success: boolean; data: LoanApplication; message: string }>(`/loans/applications/${id}/reject`, {
      rejectionReason: rejectionReason || undefined,
    });
  }

  getSchedule(id: number) {
    return this.api.get<GetRepaymentScheduleResponse>(`/loans/applications/${id}/schedule`);
  }

  payRepayment(repaymentId: number, fromAccountId: number) {
    return this.api.post<{ success: boolean; data: LoanRepaymentScheduleItem; message: string }>(
      `/loans/repayments/${repaymentId}/pay`,
      { fromAccountId },
    );
  }
}
