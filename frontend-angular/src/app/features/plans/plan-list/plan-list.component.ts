import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SavingsPlanService } from '../../../core/services/savings-plan.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';
import type { SavingsPlan } from '../../../core/models/savings-plan.model';

@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Savings Plans</h1>
        @if (auth.role() === 'CUSTOMER') {
          <div class="header-actions">
            <a routerLink="/plans/fixed-deposit" class="btn btn-primary">Open Fixed Deposit</a>
            <a routerLink="/plans/recurring-deposit" class="btn btn-secondary" style="margin-left: 0.5rem;">Open Recurring Deposit</a>
          </div>
        }
      </div>

      @if (auth.isAdmin() || auth.isEmployee()) {
        <div class="admin-actions">
          <button type="button" class="btn btn-outline" (click)="runMonthlyInterest()" [disabled]="runningJob">
            {{ runningJob ? 'Running...' : 'Run monthly interest job' }}
          </button>
          <span class="hint">Credits interest to SAVINGS accounts and FD/RD plans; processes maturities.</span>
        </div>
      }

      @if (loading) {
        <p>Loading...</p>
      } @else {
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Principal / Monthly</th>
                <th>Rate</th>
                <th>Term</th>
                <th>Current value</th>
                <th>Next due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (plan of plans; track plan.id) {
                <tr>
                  <td>{{ plan.id }}</td>
                  <td><span class="badge type-{{ plan.planType === 'FIXED_DEPOSIT' ? 'fd' : 'rd' }}">{{ plan.planType === 'FIXED_DEPOSIT' ? 'FD' : 'RD' }}</span></td>
                  <td>
                    @if (plan.planType === 'FIXED_DEPOSIT' && plan.principal != null) {
                      {{ plan.principal | number:'1.2-2' }} {{ plan.currency }}
                    } @else if (plan.planType === 'RECURRING_DEPOSIT' && plan.monthlyAmount != null) {
                      {{ plan.monthlyAmount | number:'1.2-2' }} {{ plan.currency }}/mo
                    } @else {
                      —
                    }
                  </td>
                  <td>{{ plan.interestRate }}%</td>
                  <td>{{ plan.termMonths }} mo</td>
                  <td>{{ plan.currentValue | number:'1.2-2' }} {{ plan.currency }}</td>
                  <td>
                    @if (plan.nextDueDate) {
                      {{ plan.nextDueDate | date:'shortDate' }}
                    } @else {
                      —
                    }
                  </td>
                  <td><span class="badge status-{{ plan.status.toLowerCase() }}">{{ plan.status }}</span></td>
                  <td>
                    <a [routerLink]="['/plans', plan.id]" class="action-link">View</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (plans.length === 0) {
            <div class="empty-message">No savings plans yet. Open a Fixed Deposit or Recurring Deposit to get started.</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .header-actions { display: flex; flex-wrap: wrap; }
    .admin-actions { margin-bottom: 1rem; padding: 0.75rem 1rem; background: var(--card-bg); border-radius: 8px; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .admin-actions .hint { font-size: 0.875rem; color: var(--color-text-muted); }
    .table-card { background: var(--card-bg); border-radius: 8px; padding: 1rem; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid var(--border); }
    .data-table th { font-weight: 600; color: var(--color-text-muted); }
    .badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85rem; }
    .type-fd { background: #dbeafe; color: #1e40af; }
    .type-rd { background: #e0e7ff; color: #3730a3; }
    .status-active { background: #d1fae5; color: #065f46; }
    .status-matured { background: #e0e7ff; color: #3730a3; }
    .status-closed { background: #f3f4f6; color: #4b5563; }
    .empty-message { padding: 1.5rem; text-align: center; color: var(--color-text-muted); }
    .action-link { margin-right: 0.5rem; }
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--color-text); }
    .btn-outline:hover:not(:disabled) { background: #f3f4f6; }
  `],
})
export class PlanListComponent implements OnInit {
  plans: SavingsPlan[] = [];
  loading = false;
  runningJob = false;

  constructor(
    private planService: SavingsPlanService,
    public auth: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.planService.list().subscribe({
      next: (res) => {
        this.plans = res.data ?? [];
        this.loading = false;
      },
      error: (err) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to load plans';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }

  runMonthlyInterest(): void {
    this.runningJob = true;
    this.planService.runMonthlyInterest().subscribe({
      next: (res) => {
        this.toast.showSuccess(res.message ?? 'Monthly interest job completed.');
        this.runningJob = false;
        this.load();
      },
      error: (err) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Job failed';
        this.toast.showError(msg);
        this.runningJob = false;
      },
    });
  }
}
