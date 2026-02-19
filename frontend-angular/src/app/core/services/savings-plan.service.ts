import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import type {
  SavingsPlan,
  CreateFixedDepositRequest,
  CreateRecurringDepositRequest,
  ListSavingsPlansResponse,
  GetSavingsPlanResponse,
  RunMonthlyInterestResponse,
} from '../models/savings-plan.model';

@Injectable({ providedIn: 'root' })
export class SavingsPlanService {
  constructor(private api: ApiService) {}

  list(params?: { status?: string; planType?: string }) {
    const q: Record<string, string> = {};
    if (params?.status) q['status'] = params.status;
    if (params?.planType) q['planType'] = params.planType;
    return this.api.get<ListSavingsPlansResponse>('/savings-plans', q);
  }

  getById(id: number) {
    return this.api.get<GetSavingsPlanResponse>(`/savings-plans/${id}`);
  }

  createFixedDeposit(body: CreateFixedDepositRequest) {
    return this.api.post<SavingsPlan>('/savings-plans/fixed-deposit', body);
  }

  createRecurringDeposit(body: CreateRecurringDepositRequest) {
    return this.api.post<SavingsPlan>('/savings-plans/recurring-deposit', body);
  }

  runMonthlyInterest() {
    return this.api.post<RunMonthlyInterestResponse>('/savings-plans/run-monthly-interest', {});
  }
}
