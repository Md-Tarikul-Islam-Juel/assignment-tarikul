import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SavingsPlanService } from '../../../core/services/savings-plan.service';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../shared/toast/toast.service';
import type { Account } from '../../../core/models/account.model';

@Component({
  selector: 'app-plan-create-rd',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container">
      <h1 class="page-title">Open Recurring Deposit</h1>
      <p class="muted">A fixed monthly amount will be debited from your chosen account each month until maturity.</p>

      @if (accounts.length === 0 && !loadingAccounts) {
        <p class="muted">You need at least one non-loan account. <a routerLink="/accounts">View accounts</a>.</p>
      } @else if (form && accounts.length > 0) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card">
          <div class="form-group">
            <label for="sourceAccountId">Source account (for monthly debits)</label>
            <select id="sourceAccountId" formControlName="sourceAccountId">
              <option [ngValue]="null" disabled>Select account</option>
              @for (a of accounts; track a.id) {
                @if (a.type !== 'LOAN') {
                  <option [ngValue]="a.id">{{ a.accountNumber }} ({{ a.type }}) — {{ a.availableBalance | number:'1.2-2' }} {{ a.currency }}</option>
                }
              }
            </select>
          </div>
          <div class="form-group">
            <label for="monthlyAmount">Monthly amount</label>
            <input id="monthlyAmount" type="number" formControlName="monthlyAmount" step="0.01" min="0.01" />
          </div>
          <div class="form-group">
            <label for="termMonths">Term (months)</label>
            <input id="termMonths" type="number" formControlName="termMonths" min="1" />
          </div>
          <div class="form-group">
            <label for="interestRate">Annual interest rate (%)</label>
            <input id="interestRate" type="number" formControlName="interestRate" step="0.01" min="0" />
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading">
            {{ loading ? 'Creating...' : 'Create Recurring Deposit' }}
          </button>
          <a routerLink="/plans" class="btn btn-secondary" style="margin-left: 0.5rem;">Cancel</a>
        </form>
      }
    </div>
  `,
  styles: [`
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-weight: 600; margin-bottom: 0.25rem; }
    .form-group input, .form-group select { width: 100%; max-width: 20rem; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border); }
  `],
})
export class PlanCreateRdComponent implements OnInit {
  form!: FormGroup;
  accounts: Account[] = [];
  loadingAccounts = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private planService: SavingsPlanService,
    private accountService: AccountService,
    private router: Router,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      sourceAccountId: [null as number | null, [Validators.required]],
      monthlyAmount: [null as number | null, [Validators.required, Validators.min(0.01)]],
      termMonths: [12, [Validators.required, Validators.min(1)]],
      interestRate: [5, [Validators.required, Validators.min(0)]],
    });
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loadingAccounts = true;
    this.accountService.list({ limit: 100, offset: 0 }).subscribe({
      next: (res) => {
        this.accounts = (res.data ?? []).filter(a => a.type !== 'LOAN');
        this.loadingAccounts = false;
      },
      error: () => {
        this.loadingAccounts = false;
      },
    });
  }

  onSubmit(): void {
    if (!this.form.valid) return;
    const raw = this.form.getRawValue();
    this.loading = true;
    this.planService.createRecurringDeposit({
      sourceAccountId: Number(raw.sourceAccountId),
      monthlyAmount: Number(raw.monthlyAmount),
      termMonths: Number(raw.termMonths),
      interestRate: Number(raw.interestRate),
    }).subscribe({
      next: (res) => {
        const plan = (res as { data?: { id: number } }).data ?? (res as { id: number });
        this.toast.showSuccess('Recurring deposit created successfully.');
        this.router.navigate(['/plans', plan.id]);
        this.loading = false;
      },
      error: (err) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to create recurring deposit';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }
}
