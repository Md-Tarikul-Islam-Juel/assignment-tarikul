import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../../core/services/report.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import type { LoanBalanceItem } from '../../../core/models/report.model';

@Component({
  selector: 'app-loan-balances-report',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="report-section">
      <h2 class="section-title">Loan Balances</h2>
      <p class="muted">Approved loans with outstanding balance (paid principal vs total).</p>
      @if (loading) {
        <p>Loading...</p>
      } @else {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Loan #</th>
                <th>Type</th>
                <th>Currency</th>
                <th>Total</th>
                <th>Paid principal</th>
                <th>Outstanding</th>
                @if (showUserIdColumn()) {
                  <th>User ID</th>
                }
                <th>Applied</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (row of items; track row.loanApplicationId) {
                <tr>
                  <td>{{ row.loanApplicationId }}</td>
                  <td>{{ row.loanType }}</td>
                  <td>{{ row.currency }}</td>
                  <td>{{ row.totalAmount | number:'1.2-2' }}</td>
                  <td>{{ row.paidPrincipal | number:'1.2-2' }}</td>
                  <td><strong>{{ row.outstandingBalance | number:'1.2-2' }}</strong></td>
                  @if (showUserIdColumn()) {
                    <td>{{ row.userId }}</td>
                  }
                  <td>{{ row.appliedAt | date:'shortDate' }}</td>
                  <td>
                    @if (row.accountId) {
                      <a [routerLink]="['/accounts', row.accountId]" class="action-link">Account</a>
                    }
                    <a [routerLink]="['/loans', row.loanApplicationId]" class="action-link">View</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (items.length === 0 && !loading) {
          <p class="muted">No approved loans.</p>
        }
      }
    </div>
  `,
  styles: [`
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .data-table th { background: #f9fafb; font-weight: 600; }
    .table-wrap { overflow-x: auto; }
    .action-link { margin-right: 0.5rem; }
  `],
})
export class LoanBalancesReportComponent implements OnInit {
  items: LoanBalanceItem[] = [];
  loading = false;

  constructor(
    private reportService: ReportService,
    private toast: ToastService,
    private auth: AuthService,
  ) {}

  showUserIdColumn(): boolean {
    return this.auth.hasRole(['ADMIN', 'EMPLOYEE']);
  }

  ngOnInit(): void {
    this.loading = true;
    this.reportService.getLoanBalances().subscribe({
      next: (res) => {
        this.items = res.data ?? [];
        this.loading = false;
      },
      error: (err: { error?: { detail?: string }; message?: string }) => {
        this.toast.showError(err.error?.detail ?? err.message ?? 'Failed to load report');
        this.loading = false;
      },
    });
  }
}
