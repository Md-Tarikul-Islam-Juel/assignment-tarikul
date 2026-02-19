import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../../core/services/report.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import type { AccountSummaryItem } from '../../../core/models/report.model';

@Component({
  selector: 'app-account-summary-report',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="report-section">
      <h2 class="section-title">Account Summary</h2>
      <p class="muted">Overview of all accounts with balances.</p>
      @if (loading) {
        <p>Loading...</p>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Type</th>
                <th>Currency</th>
                <th>Balance</th>
                <th>Available</th>
                <th>Status</th>
                @if (showOwnerColumn()) {
                  <th>Owner</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (a of items; track a.id) {
                <tr>
                  <td><code>{{ a.accountNumber }}</code></td>
                  <td>{{ a.type }}</td>
                  <td>{{ a.currency }}</td>
                  <td>{{ a.balance | number:'1.2-2' }}</td>
                  <td>{{ a.availableBalance | number:'1.2-2' }}</td>
                  <td>{{ a.status }}</td>
                  @if (showOwnerColumn()) {
                    <td>{{ a.ownerEmail || '–' }}</td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (items.length === 0 && !loading) {
          <p class="muted">No accounts found.</p>
        }
        <p class="muted small">Total: {{ total }} account(s)</p>
      }
    </div>
  `,
  styles: [`
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .data-table th { background: #f9fafb; font-weight: 600; }
    .table-wrap { overflow-x: auto; }
    .small { font-size: 0.875rem; margin-top: 0.5rem; }
  `],
})
export class AccountSummaryReportComponent implements OnInit {
  items: AccountSummaryItem[] = [];
  total = 0;
  loading = false;

  constructor(
    private reportService: ReportService,
    private toast: ToastService,
    private auth: AuthService,
  ) {}

  showOwnerColumn(): boolean {
    return this.auth.hasRole(['ADMIN', 'EMPLOYEE']);
  }

  ngOnInit(): void {
    this.loading = true;
    const userId = this.auth.isCustomer() ? undefined : undefined;
    this.reportService.getAccountSummary(userId).subscribe({
      next: (res) => {
        this.items = res.data ?? [];
        this.total = res.total ?? 0;
        this.loading = false;
      },
      error: (err: { error?: { detail?: string }; message?: string }) => {
        this.toast.showError(err.error?.detail ?? err.message ?? 'Failed to load report');
        this.loading = false;
      },
    });
  }
}
