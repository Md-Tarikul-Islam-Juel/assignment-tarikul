import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../shared/toast/toast.service';
import type { Account } from '../../../core/models/account.model';
import type { Transaction } from '../../../core/models/account.model';
import type { MonthlyStatementResponse } from '../../../core/models/report.model';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-monthly-statement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="report-section">
      <h2 class="section-title">Monthly Statement</h2>
      <p class="muted">Generate a statement with all transactions for a given account and month.</p>
      <div class="card filters">
        <div class="form-group">
          <label for="accountId">Account</label>
          <select id="accountId" [(ngModel)]="selectedAccountId" (ngModelChange)="loadStatement()">
            <option [ngValue]="null">Select account</option>
            @for (a of accounts; track a.id) {
              @if (a.type !== 'LOAN') {
                <option [ngValue]="a.id">{{ a.accountNumber }} ({{ a.type }})</option>
              }
            }
          </select>
        </div>
        <div class="form-group">
          <label for="year">Year</label>
          <input id="year" type="number" [(ngModel)]="year" (ngModelChange)="loadStatement()" min="2020" max="2030" />
        </div>
        <div class="form-group">
          <label for="month">Month</label>
          <select id="month" [(ngModel)]="month" (ngModelChange)="loadStatement()">
            @for (m of monthOptions; track m.value) {
              <option [ngValue]="m.value">{{ m.label }}</option>
            }
          </select>
        </div>
        <button type="button" class="btn btn-primary" (click)="loadStatement(true)" [disabled]="loading || !selectedAccountId">Generate</button>
      </div>
      @if (loading) {
        <p>Loading statement...</p>
      } @else if (statementData()) {
        <div class="card statement">
          <h3>Statement for {{ statementData()!.account.accountNumber }}</h3>
          <p class="period">{{ getMonthName(statementData()!.period.month) }} {{ statementData()!.period.year }}</p>
          <div class="balances">
            <div><strong>Opening balance:</strong> {{ statementData()!.openingBalance | number:'1.2-2' }} {{ statementData()!.account.currency }}</div>
            <div><strong>Closing balance:</strong> {{ statementData()!.closingBalance | number:'1.2-2' }} {{ statementData()!.account.currency }}</div>
          </div>
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
                @for (t of statementData()!.transactions; track t.id) {
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
          @if (statementData()!.transactions.length === 0) {
            <p class="muted">No transactions in this period.</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .form-group { margin-bottom: 0.5rem; }
    .form-group label { display: block; font-weight: 600; margin-bottom: 0.25rem; }
    .filters { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; }
    .filters .btn { margin-bottom: 0.5rem; }
    .period { color: var(--muted, #6b7280); margin: 0.25rem 0 1rem 0; }
    .balances { display: flex; gap: 2rem; margin-bottom: 1rem; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .data-table th { background: #f9fafb; font-weight: 600; }
    .tx-type.credit { color: #059669; }
    .credit { color: #059669; }
    .debit { color: #374151; }
    .ref { font-size: 0.8em; background: #f3f4f6; padding: 0.2rem 0.4rem; border-radius: 0.25rem; }
    .table-wrap { overflow-x: auto; }
  `],
})
export class MonthlyStatementComponent implements OnInit {
  accounts: Account[] = [];
  selectedAccountId: number | null = null;
  year = new Date().getFullYear();
  month = new Date().getMonth() + 1;
  monthOptions = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
  ];
  loading = false;
  statementData = signal<MonthlyStatementResponse['data'] | null>(null);

  constructor(
    private reportService: ReportService,
    private accountService: AccountService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.accountService.list({ limit: 100, offset: 0 }).subscribe({
      next: (res) => {
        this.accounts = (res.data ?? []).filter((a) => a.type !== 'LOAN');
        if (this.accounts.length > 0 && !this.selectedAccountId) {
          this.selectedAccountId = this.accounts[0].id;
          this.loadStatement();
        }
      },
      error: () => {},
    });
  }

  loadStatement(shouldDownloadPdf = false): void {
    if (!this.selectedAccountId) return;
    this.loading = true;
    this.statementData.set(null);
    this.reportService.getMonthlyStatement(this.selectedAccountId, this.year, this.month).subscribe({
      next: (res) => {
        this.statementData.set(res.data);
        this.loading = false;
        if (shouldDownloadPdf && res.data) this.downloadPdf(res.data);
      },
      error: (err: { error?: { detail?: string }; message?: string }) => {
        this.toast.showError(err.error?.detail ?? err.message ?? 'Failed to load statement');
        this.loading = false;
      },
    });
  }

  isCredit(t: Transaction): boolean {
    return t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN' || t.type === 'INTEREST_CREDIT' || t.type === 'LOAN_DISBURSEMENT';
  }

  getMonthName(m: number): string {
    return this.monthOptions.find((o) => o.value === m)?.label ?? '';
  }

  downloadPdf(data: MonthlyStatementResponse['data']): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const monthName = this.getMonthName(data.period.month);
    const title = `Statement for ${data.account.accountNumber}`;
    const period = `${monthName} ${data.period.year}`;

    doc.setFontSize(18);
    doc.text('BankApp', 14, 15);
    doc.setFontSize(14);
    doc.text(title, 14, 24);
    doc.setFontSize(11);
    doc.text(period, 14, 31);
    doc.text(`Opening balance: ${data.openingBalance.toFixed(2)} ${data.account.currency}`, 14, 38);
    doc.text(`Closing balance: ${data.closingBalance.toFixed(2)} ${data.account.currency}`, 14, 45);

    const tableBody = data.transactions.map((t) => [
      new Date(t.createdAt).toLocaleString(),
      t.type,
      t.referenceNumber || '–',
      (this.isCredit(t) ? '+' : '') + Number(t.amount).toFixed(2),
      Number(t.balanceAfter).toFixed(2),
      (t.description || '–').slice(0, 40),
    ]);
    autoTable(doc, {
      head: [['Date', 'Type', 'Reference', 'Amount', 'Balance after', 'Description']],
      body: tableBody,
      startY: 52,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 28 },
        2: { cellWidth: 38 },
        3: { cellWidth: 22 },
        4: { cellWidth: 28 },
        5: { cellWidth: 'auto' },
      },
    });

    const filename = `statement-${data.account.accountNumber}-${data.period.year}-${String(data.period.month).padStart(2, '0')}.pdf`;
    doc.save(filename);
    this.toast.showSuccess('PDF downloaded.');
  }
}