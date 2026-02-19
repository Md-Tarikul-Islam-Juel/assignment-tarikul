import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';
import type { LoanApplication } from '../../../core/models/loan.model';

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Loan Applications</h1>
        @if (auth.role() === 'CUSTOMER') {
          <a routerLink="/loans/apply" class="btn btn-primary">Apply for loan</a>
        }
      </div>

      @if (loading) {
        <p>Loading...</p>
      } @else {
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Term</th>
                <th>Rate %</th>
                <th>Status</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (app of applications; track app.id) {
                <tr>
                  <td>{{ app.id }}</td>
                  <td>{{ app.loanType }}</td>
                  <td>{{ app.amount | number:'1.2-2' }} {{ app.currency }}</td>
                  <td>{{ app.termMonths }} mo</td>
                  <td>{{ app.status === 'PENDING' ? '—' : app.interestRate + '%' }}</td>
                  <td><span class="badge status-{{ app.status.toLowerCase() }}">{{ app.status }}</span></td>
                  <td>{{ app.appliedAt | date:'short' }}</td>
                  <td>
                    <a [routerLink]="['/loans', app.id]" class="action-link">View</a>
                    @if (app.status === 'APPROVED') {
                      <a [routerLink]="['/loans', app.id, 'schedule']" class="action-link">Schedule</a>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (applications.length === 0) {
            <div class="empty-message">No loan applications found.</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .table-card { background: var(--card-bg); border-radius: 8px; padding: 1rem; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid var(--border); }
    .data-table th { font-weight: 600; color: var(--color-text-muted); }
    .badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85rem; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-approved { background: #d1fae5; color: #065f46; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .empty-message { padding: 1.5rem; text-align: center; color: var(--color-text-muted); }
    .action-link { margin-right: 0.5rem; }
  `],
})
export class LoanListComponent implements OnInit {
  applications: LoanApplication[] = [];
  loading = false;

  constructor(
    private loanService: LoanService,
    public auth: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    const params = this.auth.role() === 'CUSTOMER' ? {} : undefined;
    this.loanService.list({ limit: 50, offset: 0, ...params }).subscribe({
      next: (res) => {
        this.applications = res.data;
        this.loading = false;
      },
      error: (err) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to load applications';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }
}
