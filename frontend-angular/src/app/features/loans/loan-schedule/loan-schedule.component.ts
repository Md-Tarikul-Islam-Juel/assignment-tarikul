import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoanService } from '../../../core/services/loan.service';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';
import type { LoanRepaymentScheduleItem } from '../../../core/models/loan.model';
import type { Account } from '../../../core/models/account.model';

@Component({
  selector: 'app-loan-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <h1 class="page-title">Repayment schedule</h1>
      @if (loading) {
        <p>Loading...</p>
      } @else {
        <p class="muted">Loan application #{{ applicationId }}. Pay an installment by selecting due date and your account to debit.</p>
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Due date</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>Penalty</th>
                <th>Total</th>
                <th>Status</th>
                <th>Paid at</th>
                @if (auth.role() === 'CUSTOMER') {
                  <th>Pay</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of schedule; track row.id) {
                <tr>
                  <td>{{ row.installmentNumber }}</td>
                  <td>{{ row.dueDate }}</td>
                  <td>{{ row.principalAmount | number:'1.2-2' }}</td>
                  <td>{{ row.interestAmount | number:'1.2-2' }}</td>
                  <td>{{ row.penaltyAmount | number:'1.2-2' }}</td>
                  <td>{{ row.totalAmount | number:'1.2-2' }}</td>
                  <td><span class="badge status-{{ row.status.toLowerCase() }}">{{ row.status }}</span></td>
                  <td>{{ row.paidAt ? (row.paidAt | date:'short') : '—' }}</td>
                  @if (auth.role() === 'CUSTOMER' && row.status !== 'PAID') {
                    <td>
                      @if (payingRepaymentId === row.id) {
                        <div class="pay-form">
                          <select [(ngModel)]="selectedAccountId" class="pay-select">
                            <option value="">Select account</option>
                            @for (acc of payFromAccounts; track acc.id) {
                              <option [value]="acc.id">{{ acc.accountNumber }} ({{ acc.type }}) — {{ acc.balance | number:'1.2-2' }} {{ acc.currency }}</option>
                            }
                          </select>
                          <button type="button" class="btn btn-primary btn-sm" (click)="confirmPay(row)" [disabled]="!selectedAccountId || payLoading">Pay {{ row.totalAmount | number:'1.2-2' }}</button>
                          <button type="button" class="btn btn-secondary btn-sm" (click)="cancelPay()">Cancel</button>
                        </div>
                      } @else {
                        <button type="button" class="btn btn-primary btn-sm" (click)="startPay(row)">Pay</button>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
          @if (schedule.length === 0) {
            <div class="empty-message">No schedule entries.</div>
          }
        </div>
        <a [routerLink]="['/loans', applicationId]" class="btn btn-secondary" style="margin-top: 1rem;">Back to application</a>
      }
    </div>
  `,
  styles: [`
    .table-card { background: var(--card-bg); border-radius: 8px; padding: 1rem; overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid var(--border); }
    .data-table th { font-weight: 600; color: var(--color-text-muted); }
    .badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85rem; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-overdue { background: #fee2e2; color: #991b1b; }
    .empty-message { padding: 1.5rem; text-align: center; color: var(--color-text-muted); }
    .pay-form { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
    .pay-select { min-width: 12rem; padding: 0.35rem 0.5rem; }
    .btn-sm { padding: 0.35rem 0.6rem; font-size: 0.875rem; }
  `],
})
export class LoanScheduleComponent implements OnInit {
  applicationId!: number;
  schedule: LoanRepaymentScheduleItem[] = [];
  loading = false;
  payFromAccounts: Account[] = [];
  payingRepaymentId: number | null = null;
  selectedAccountId: number | null = null;
  payLoading = false;

  constructor(
    private route: ActivatedRoute,
    private loanService: LoanService,
    private accountService: AccountService,
    public auth: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.applicationId = Number(id);
    this.loading = true;
    this.loanService.getSchedule(this.applicationId).subscribe({
      next: (res) => {
        this.schedule = res.data;
        this.loading = false;
      },
      error: (err) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to load schedule';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
    if (this.auth.role() === 'CUSTOMER') {
      this.accountService.list({ limit: 50 }).subscribe({
        next: (res) => {
          this.payFromAccounts = (res.data || []).filter((a) => a.type !== 'LOAN');
        },
      });
    }
  }

  startPay(row: LoanRepaymentScheduleItem): void {
    this.payingRepaymentId = row.id;
    this.selectedAccountId = this.payFromAccounts.length > 0 ? this.payFromAccounts[0].id : null;
  }

  cancelPay(): void {
    this.payingRepaymentId = null;
    this.selectedAccountId = null;
  }

  confirmPay(row: LoanRepaymentScheduleItem): void {
    const accountId = this.selectedAccountId != null ? Number(this.selectedAccountId) : null;
    if (accountId == null) return;
    this.payLoading = true;
    this.loanService.payRepayment(row.id, accountId).subscribe({
      next: () => {
        this.toast.showSuccess('Payment successful.');
        this.payingRepaymentId = null;
        this.selectedAccountId = null;
        this.payLoading = false;
        this.loadSchedule();
      },
      error: (err) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Payment failed';
        this.toast.showError(msg);
        this.payLoading = false;
      },
    });
  }

  private loadSchedule(): void {
    this.loanService.getSchedule(this.applicationId).subscribe({
      next: (res) => (this.schedule = res.data),
    });
  }
}
