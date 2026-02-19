import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../shared/toast/toast.service';
import type { Transaction } from '../../../core/models/account.model';

const TRANSACTION_TYPES: { value: string; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'DEPOSIT', label: 'Deposit' },
  { value: 'WITHDRAWAL', label: 'Withdrawal' },
  { value: 'TRANSFER_IN', label: 'Transfer In' },
  { value: 'TRANSFER_OUT', label: 'Transfer Out' },
  { value: 'FEE', label: 'Fee' },
  { value: 'INTEREST_CREDIT', label: 'Interest' },
];

@Component({
  selector: 'app-account-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <h1 class="page-title">Transaction history</h1>
      @if (accountId) {
        @if (loading) {
          <p>Loading...</p>
        } @else {
          <div class="filters card">
            <label>Type <select [(ngModel)]="filterType" (ngModelChange)="loadHistory()">
              @for (opt of typeOptions; track opt.value) {
                <option [value]="opt.value">{{ opt.label }}</option>
              }
            </select></label>
            <label>From <input type="date" [(ngModel)]="filterStartDate" (ngModelChange)="loadHistory()" /></label>
            <label>To <input type="date" [(ngModel)]="filterEndDate" (ngModelChange)="loadHistory()" /></label>
          </div>
          <div class="table-wrap">
            <table class="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Balance after</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                @for (t of transactions; track t.id) {
                  <tr>
                    <td>{{ t.createdAt | date:'short' }}</td>
                    <td><span class="tx-type" [class.credit]="isCredit(t)">{{ t.type }}</span></td>
                    <td><code class="ref">{{ t.referenceNumber || '–' }}</code></td>
                    <td [class.credit]="isCredit(t)" [class.debit]="!isCredit(t)">{{ isCredit(t) ? '+' : '' }}{{ t.amount | number:'1.2-2' }}</td>
                    <td>{{ t.balanceAfter | number:'1.2-2' }}</td>
                    <td>{{ t.description || '–' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (transactions.length === 0 && !loading) {
            <p class="muted">No transactions found.</p>
          }
          <a [routerLink]="['/accounts', accountId]" class="btn btn-secondary">Back to account</a>
        }
      }
    </div>
  `,
  styles: [`
    .filters { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; margin-bottom: 1rem; }
    .filters label { display: flex; align-items: center; gap: 0.5rem; }
    .history-table { width: 100%; border-collapse: collapse; }
    .history-table th, .history-table td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .history-table th { background: #f9fafb; font-weight: 600; }
    .tx-type.credit { color: #059669; }
    .tx-type { font-weight: 500; }
    .credit { color: #059669; }
    .debit { color: #374151; }
    .ref { font-size: 0.8em; background: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 0.25rem; }
  `],
})
export class AccountHistoryComponent implements OnInit {
  accountId: number | null = null;
  transactions: Transaction[] = [];
  loading = false;
  filterType = '';
  filterStartDate = '';
  filterEndDate = '';
  typeOptions = TRANSACTION_TYPES;

  constructor(
    private route: ActivatedRoute,
    private accountService: AccountService,
    private toast: ToastService,
  ) {}

  isCredit(t: Transaction): boolean {
    return t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN' || t.type === 'INTEREST_CREDIT' || t.type === 'LOAN_DISBURSEMENT';
  }

  loadHistory(): void {
    if (this.accountId == null) return;
    this.loading = true;
    const params: { limit: number; offset: number; type?: string; startDate?: string; endDate?: string } = { limit: 50, offset: 0 };
    if (this.filterType) params.type = this.filterType;
    if (this.filterStartDate) params.startDate = this.filterStartDate;
    if (this.filterEndDate) params.endDate = this.filterEndDate;
    this.accountService.getHistory(this.accountId, params).subscribe({
      next: (res) => {
        this.transactions = res.data;
        this.loading = false;
      },
      error: (err: { error?: { message?: string; detail?: string }; message?: string }) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to load history';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.accountId = Number(id);
    this.loadHistory();
  }
}
