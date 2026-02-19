import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';
import type { LoanApplication } from '../../../core/models/loan.model';

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      @if (loading) {
        <p>Loading...</p>
      } @else if (application) {
        <h1 class="page-title">Loan application #{{ application.id }}</h1>
        <div class="card">
          <dl class="detail-list">
            <dt>Loan type</dt>
            <dd>{{ application.loanType }}</dd>
            <dt>Amount</dt>
            <dd>{{ application.amount | number:'1.2-2' }} {{ application.currency }}</dd>
            <dt>Term</dt>
            <dd>{{ application.termMonths }} months</dd>
            @if (application.status !== 'PENDING') {
              <dt>Interest rate</dt>
              <dd>{{ application.interestRate }}% per year</dd>
            }
            @if (application.purpose) {
              <dt>Purpose</dt>
              <dd>{{ application.purpose }}</dd>
            }
            <dt>Status</dt>
            <dd><span class="badge status-{{ application.status.toLowerCase() }}">{{ application.status }}</span></dd>
            <dt>Applied at</dt>
            <dd>{{ application.appliedAt | date:'medium' }}</dd>
            @if (application.decidedAt) {
              <dt>Decided at</dt>
              <dd>{{ application.decidedAt | date:'medium' }}</dd>
            }
            @if (application.rejectionReason) {
              <dt>Rejection reason</dt>
              <dd>{{ application.rejectionReason }}</dd>
            }
            @if (application.accountId) {
              <dt>Loan account ID</dt>
              <dd><a [routerLink]="['/accounts', application.accountId]">View account {{ application.accountId }}</a></dd>
            }
          </dl>
          <div class="actions">
            @if (application.status === 'APPROVED') {
              <a [routerLink]="['/loans', application.id, 'schedule']" class="btn btn-primary">View repayment schedule</a>
            }
            @if (application.status === 'PENDING' && auth.canApproveLoan()) {
              <button type="button" class="btn btn-primary" (click)="approve()" [disabled]="actionLoading">Approve</button>
              <button type="button" class="btn btn-danger" (click)="reject()" [disabled]="actionLoading">Reject</button>
            }
            <a routerLink="/loans" class="btn btn-secondary" style="margin-left: 0.5rem;">Back to list</a>
          </div>
        </div>
      } @else {
        <p class="muted">Loan application not found. <a routerLink="/loans">Back to list</a></p>
      }
    </div>
  `,
  styles: [`
    .detail-list { display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1.5rem; margin-bottom: 1rem; }
    .detail-list dt { font-weight: 600; color: var(--color-text-muted); }
    .badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85rem; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-approved { background: #d1fae5; color: #065f46; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .actions { margin-top: 1rem; }
    .btn-danger { background: #dc2626; color: white; border: none; }
    .btn-danger:hover:not(:disabled) { background: #b91c1c; }
  `],
})
export class LoanDetailComponent implements OnInit {
  application: LoanApplication | null = null;
  loading = false;
  actionLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loanService: LoanService,
    public auth: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading = true;
    this.loanService.getById(Number(id)).subscribe({
      next: (res) => {
        this.application = res.data;
        this.loading = false;
      },
      error: (err) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to load application';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }

  approve(): void {
    if (!this.application) return;
    const rateInput = window.prompt('Enter interest rate (% per year) for this loan:', '6.5');
    if (rateInput === null) return;
    const interestRate = parseFloat(rateInput);
    if (Number.isNaN(interestRate) || interestRate < 0 || interestRate > 100) {
      this.toast.showError('Please enter a valid interest rate (0–100).');
      return;
    }
    this.actionLoading = true;
    this.loanService.approve(this.application.id, interestRate).subscribe({
      next: (res) => {
        this.application = res.data;
        this.toast.showSuccess(res.message ?? 'Loan approved.');
        this.actionLoading = false;
      },
      error: (err) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Approval failed';
        this.toast.showError(msg);
        this.actionLoading = false;
      },
    });
  }

  reject(): void {
    if (!this.application) return;
    const reason = window.prompt('Rejection reason (optional):');
    this.actionLoading = true;
    this.loanService.reject(this.application.id, reason ?? undefined).subscribe({
      next: (res) => {
        this.application = res.data;
        this.toast.showSuccess('Loan application rejected.');
        this.actionLoading = false;
      },
      error: (err) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Reject failed';
        this.toast.showError(msg);
        this.actionLoading = false;
      },
    });
  }
}
