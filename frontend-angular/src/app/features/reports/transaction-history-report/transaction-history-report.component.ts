import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../shared/toast/toast.service';
import type { Account } from '../../../core/models/account.model';
import type { Transaction } from '../../../core/models/account.model';

@Component({
  selector: 'app-transaction-history-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="report-section">
      <h2 class="section-title">Transaction History</h2>
      <p class="muted">Detailed transaction history for an account within a date range.</p>
      <div class="card filters">
        <div class="form-group">
          <label for="accountId">Account</label>
          <select id="accountId" [(ngModel)]="selectedAccountId" (ngModelChange)="loadHistory()">
            <option [ngValue]="null">Select account</option>
            @for (a of accounts; track a.id) {
              <option [ngValue]="a.id">{{ a.accountNumber }} ({{ a.type }})</option>
            }
          </select>
        </div>
        <div class="form-group">
          <label for="startDate">From</label>
          <input id="startDate" type="date" [(ngModel)]="startDate" (ngModelChange)="loadHistory()" />
        </div>
        <div class="form-group">
          <label for="endDate">To</label>
          <input id="endDate" type="date" [(ngModel)]="endDate" (ngModelChange)="loadHistory()" />
        </div>
        <button type="button" class="btn btn-primary" (click)="loadHistory()" [disabled]="loading || !selectedAccountId">Load</button>
      </div>
      @if (loading) {
        <p>Loading...</p>
      } @else if (selectedAccountId) {
        <div class="table-wrap">
          <table class="data-table">
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
          <p class="muted">No transactions in this range.</p>
        }
        <p class="muted small">Total: {{ total }} transaction(s)</p>
      }
    </div>
  `,
  styles: [`
    .form-group { margin-bottom: 0.5rem; }
    .form-group label { display: block; font-weight: 600; margin-bottom: 0.25rem; }
    .filters { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .data-table th { background: #f9fafb; font-weight: 600; }
    .tx-type.credit { color: #059669; }
    .credit { color: #059669; }
    .debit { color: #374151; }
    .ref { font-size: 0.8em; background: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 0.25rem; }
    .table-wrap { overflow-x: auto; }
    .small { font-size: 0.875rem; margin-top: 0.5rem; }
  `],
})
export class TransactionHistoryReportComponent implements OnInit {
  accounts: Account[] = [];
  selectedAccountId: number | null = null;
  startDate = '';
  endDate = '';
  transactions: Transaction[] = [];
  total = 0;
  loading = false;

  constructor(
    private reportService: ReportService,
    private accountService: AccountService,
    private toast: ToastService,
  ) {}

  isCredit(t: Transaction): boolean {
    return t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN' || t.type === 'INTEREST_CREDIT' || t.type === 'LOAN_DISBURSEMENT';
  }

  loadHistory(): void {
    if (!this.selectedAccountId) return;
    this.loading = true;
    this.reportService.getTransactionHistory(this.selectedAccountId, {
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
      limit: 200,
      offset: 0,
    }).subscribe({
      next: (res) => {
        this.transactions = res.data ?? [];
        this.total = res.total ?? 0;
        this.loading = false;
      },
      error: (err: { error?: { detail?: string }; message?: string }) => {
        this.toast.showError(err.error?.detail ?? err.message ?? 'Failed to load history');
        this.loading = false;
      },
    });
  }

  ngOnInit(): void {
    this.accountService.list({ limit: 100, offset: 0 }).subscribe({
      next: (res) => {
        this.accounts = res.data ?? [];
        if (this.accounts.length > 0 && !this.selectedAccountId) {
          this.selectedAccountId = this.accounts[0].id;
          const now = new Date();
          this.endDate = now.toISOString().slice(0, 10);
          const past = new Date(now.getFullYear(), now.getMonth(), 1);
          this.startDate = past.toISOString().slice(0, 10);
          this.loadHistory();
        }
      },
      error: () => {},
    });
  }
}
