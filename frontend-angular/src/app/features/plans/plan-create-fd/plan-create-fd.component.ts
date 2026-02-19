import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SavingsPlanService } from '../../../core/services/savings-plan.service';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../shared/toast/toast.service';
import type { Account } from '../../../core/models/account.model';

@Component({
  selector: 'app-plan-create-fd',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container">
      <h1 class="page-title">Open Fixed Deposit</h1>
      <p class="muted">The principal will be debited from your chosen account and locked until maturity.</p>

      @if (accounts.length === 0 && !loadingAccounts) {
        <p class="muted">You need at least one non-loan account to open a fixed deposit. <a routerLink="/accounts">View accounts</a>.</p>
      } @else if (form && accounts.length > 0) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card">
          <div class="form-group">
            <label for="sourceAccountId">Source account</label>
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
            <label for="principal">Principal amount</label>
            <input id="principal" type="number" formControlName="principal" step="0.01" min="1" />
          </div>
          <div class="form-group">
            <label for="termMonths">Term (months)</label>
            <input id="termMonths" type="number" formControlName="termMonths" min="1" />
          </div>
          <div class="form-group">
            <label for="interestRate">Annual interest rate (%)</label>
            <input id="interestRate" type="number" formControlName="interestRate" step="0.01" min="0" readonly />
            <p class="muted small">Rate is set automatically based on term.</p>
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading">
            {{ loading ? 'Creating...' : 'Create Fixed Deposit' }}
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
    .form-group input[readonly] { background: var(--bg-muted, #f5f5f5); cursor: not-allowed; }
    .muted.small { font-size: 0.875rem; margin-top: 0.25rem; }
  `],
})
export class PlanCreateFdComponent implements OnInit {
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

  /** Annual interest rate (%) by term tier. Term in months -> rate. Longer terms get higher rate. */
  private static readonly TERM_RATE_MAP: { maxMonths: number; rate: number }[] = [
    { maxMonths: 3, rate: 4.5 },
    { maxMonths: 6, rate: 5 },
    { maxMonths: 12, rate: 5.5 },
    { maxMonths: 24, rate: 6 },
    { maxMonths: 36, rate: 6.5 },
    { maxMonths: 120, rate: 7 },
  ];

  private static getRateForTerm(termMonths: number): number {
    const term = Math.max(1, Math.floor(Number(termMonths)));
    const tier = PlanCreateFdComponent.TERM_RATE_MAP.find((t) => term <= t.maxMonths);
    return tier ? tier.rate : PlanCreateFdComponent.TERM_RATE_MAP[PlanCreateFdComponent.TERM_RATE_MAP.length - 1].rate;
  }

  ngOnInit(): void {
    const initialTerm = 12;
    const initialRate = PlanCreateFdComponent.getRateForTerm(initialTerm);
    this.form = this.fb.group({
      sourceAccountId: [null as number | null, [Validators.required]],
      principal: [null as number | null, [Validators.required, Validators.min(1)]],
      termMonths: [initialTerm, [Validators.required, Validators.min(1)]],
      interestRate: [{ value: initialRate, disabled: true }, [Validators.required, Validators.min(0)]],
    });
    this.form.get('termMonths')?.valueChanges.subscribe((term) => {
      const rate = PlanCreateFdComponent.getRateForTerm(term);
      this.form.get('interestRate')?.setValue(rate, { emitEvent: false });
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
    this.planService.createFixedDeposit({
      sourceAccountId: Number(raw.sourceAccountId),
      principal: Number(raw.principal),
      termMonths: Number(raw.termMonths),
      interestRate: Number(raw.interestRate),
    }).subscribe({
      next: (res) => {
        const plan = (res as { data?: { id: number } }).data ?? (res as { id: number });
        this.toast.showSuccess('Fixed deposit created successfully.');
        this.router.navigate(['/plans', plan.id]);
        this.loading = false;
      },
      error: (err) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to create fixed deposit';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }
}
