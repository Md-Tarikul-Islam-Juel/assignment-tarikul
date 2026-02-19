import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import type {
  Account,
  Transaction,
  CreateAccountRequest,
  UpdateAccountRequest,
  AccountQueryParams,
  AccountHistoryQueryParams,
  ListAccountsResponse,
  GetAccountResponse,
  CreateAccountResponse,
  AccountHistoryResponse,
  DepositRequest,
  WithdrawRequest,
  TransferRequest,
  DepositResponse,
  WithdrawResponse,
  TransferResponse,
} from '../models/account.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  constructor(private api: ApiService) {}

  create(body: CreateAccountRequest) {
    return this.api.post<CreateAccountResponse>('/accounts', body);
  }

  list(params?: AccountQueryParams) {
    const q: Record<string, string | number> = {};
    if (params?.userId != null) q['userId'] = params.userId;
    if (params?.type) q['type'] = params.type;
    if (params?.status) q['status'] = params.status;
    if (params?.limit != null) q['limit'] = params.limit;
    if (params?.offset != null) q['offset'] = params.offset;
    return this.api.get<ListAccountsResponse>('/accounts', q);
  }

  getById(id: number) {
    return this.api.get<GetAccountResponse>(`/accounts/${id}`);
  }

  getByNumber(accountNumber: string) {
    return this.api.get<GetAccountResponse>(`/accounts/number/${encodeURIComponent(accountNumber)}`);
  }

  update(id: number, body: UpdateAccountRequest) {
    return this.api.put<GetAccountResponse>(`/accounts/${id}`, body);
  }

  delete(id: number) {
    return this.api.delete<void>(`/accounts/${id}`);
  }

  getHistory(id: number, params?: AccountHistoryQueryParams) {
    const q: Record<string, string | number> = {};
    if (params?.type) q['type'] = params.type;
    if (params?.limit != null) q['limit'] = params.limit;
    if (params?.offset != null) q['offset'] = params.offset;
    if (params?.startDate) q['startDate'] = params.startDate;
    if (params?.endDate) q['endDate'] = params.endDate;
    return this.api.get<AccountHistoryResponse>(`/accounts/${id}/history`, q);
  }

  deposit(id: number, body: DepositRequest) {
    return this.api.post<DepositResponse>(`/accounts/${id}/deposit`, body);
  }

  withdraw(id: number, body: WithdrawRequest) {
    return this.api.post<WithdrawResponse>(`/accounts/${id}/withdraw`, body);
  }

  transfer(id: number, body: TransferRequest) {
    return this.api.post<TransferResponse>(`/accounts/${id}/transfer`, body);
  }
}
