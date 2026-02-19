import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';
import type { Account } from '../../../core/models/account.model';

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      @if (loading) {
        <p>Loading...</p>
      } @else if (account) {
        <h1 class="page-title">Account {{ account.accountNumber }}</h1>
        <div class="card">
          <dl class="detail-list">
            <dt>Account number</dt>
            <dd>{{ account.accountNumber }}</dd>
            <dt>Type</dt>
            <dd>{{ account.type }}</dd>
            <dt>Currency</dt>
            <dd>{{ account.currency }}</dd>
            <dt>Balance</dt>
            <dd>{{ account.balance | number:'1.2-2' }}</dd>
            <dt>Available balance</dt>
            <dd>{{ account.availableBalance | number:'1.2-2' }}</dd>
            <dt>Status</dt>
            <dd>{{ account.status }}</dd>
            @if (account.interestRate != null) {
              <dt>Interest rate</dt>
              <dd>{{ account.interestRate }}%</dd>
            }
            @if (account.loanAmount != null) {
              <dt>Loan amount</dt>
              <dd>{{ account.loanAmount | number:'1.2-2' }}</dd>
              <dt>Monthly payment</dt>
              <dd>{{ account.monthlyPayment | number:'1.2-2' }}</dd>
            }
          </dl>
          <div>
            @if (account.status === 'ACTIVE' && account.type !== 'LOAN') {
              @if (auth.canUpdateAccount()) {
                <a [routerLink]="['/accounts', account.id, 'deposit']" class="btn btn-primary">Deposit</a>
              }
              <a [routerLink]="['/accounts', account.id, 'withdraw']" class="btn btn-secondary" style="margin-left: 0.5rem;">Withdraw</a>
              <a [routerLink]="['/accounts', account.id, 'transfer']" class="btn btn-secondary" style="margin-left: 0.5rem;">Transfer</a>
            }
            <a [routerLink]="['/accounts', account.id, 'history']" class="btn btn-secondary" style="margin-left: 0.5rem;">Transaction history</a>
            @if (auth.canUpdateAccount()) {
              <a [routerLink]="['/accounts', account.id, 'edit']" class="btn btn-secondary" style="margin-left: 0.5rem;">Edit</a>
            }
            @if (auth.canDeleteAccount()) {
              <button type="button" class="btn btn-danger" style="margin-left: 0.5rem;" (click)="confirmDelete()">Delete</button>
            }
            <a routerLink="/accounts" class="btn btn-secondary" style="margin-left: 0.5rem;">Back to list</a>
          </div>
        </div>
      } @else if (!loading) {
        <p class="muted">Could not load account. <a routerLink="/accounts">Back to list</a></p>
      }
    </div>
  `,
  styles: [`
    .detail-list { display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1.5rem; margin-bottom: 1rem; }
    .detail-list dt { font-weight: 600; color: var(--color-text-muted); }
    .btn-danger { background: #dc2626; color: white; border: none; }
    .btn-danger:hover { background: #b91c1c; }
  `],
})
export class AccountDetailComponent implements OnInit {
  account: Account | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    public auth: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading = true;
    this.accountService.getById(Number(id)).subscribe({
      next: (res) => {
        this.account = res.data;
        this.loading = false;
      },
      error: (err: { error?: { message?: string; detail?: string }; message?: string }) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to load account';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }

  confirmDelete(): void {
    if (!this.account) return;
    if (!window.confirm(`Delete account ${this.account.accountNumber}? This action cannot be undone.`)) return;
    this.accountService.delete(this.account.id).subscribe({
      next: () => {
        this.toast.showSuccess('Account deleted.');
        this.router.navigate(['/accounts']);
      },
      error: (err: { error?: { message?: string; detail?: string }; message?: string }) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to delete account';
        this.toast.showError(msg);
      },
    });
  }
}
