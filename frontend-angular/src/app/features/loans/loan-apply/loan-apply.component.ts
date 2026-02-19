import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoanService } from '../../../core/services/loan.service';
import { ToastService } from '../../../shared/toast/toast.service';
import type { LoanType } from '../../../core/models/loan.model';

const LOAN_TYPES: LoanType[] = ['PERSONAL', 'HOME', 'AUTO', 'EDUCATION', 'BUSINESS'];

@Component({
  selector: 'app-loan-apply',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container">
      <h1 class="page-title">Apply for a loan</h1>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card">
        <div class="form-group">
          <label for="loanType">Loan type</label>
          <select id="loanType" formControlName="loanType">
            @for (t of loanTypes; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </div>
        <div class="form-group">
          <label for="amount">Amount</label>
          <input id="amount" type="number" formControlName="amount" step="0.01" min="1" />
        </div>
        <div class="form-group">
          <label for="termMonths">Term (months)</label>
          <input id="termMonths" type="number" formControlName="termMonths" min="1" max="360" />
        </div>
        <p class="form-hint">Interest rate will be set by admin or employee when your application is reviewed.</p>
        <div class="form-group">
          <label for="purpose">Purpose (optional)</label>
          <input id="purpose" type="text" formControlName="purpose" placeholder="e.g. Home renovation" />
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading">
            {{ loading ? 'Submitting...' : 'Submit application' }}
          </button>
          <a routerLink="/loans" class="btn btn-secondary" style="margin-left: 0.5rem;">Cancel</a>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-weight: 500; margin-bottom: 0.25rem; }
    .form-group input, .form-group select { width: 100%; max-width: 20rem; padding: 0.5rem; }
    .form-hint { color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1rem; }
    .form-actions { margin-top: 1rem; }
  `],
})
export class LoanApplyComponent {
  form!: FormGroup;
  loanTypes = LOAN_TYPES;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private loanService: LoanService,
    private router: Router,
    private toast: ToastService,
  ) {
    this.form = this.fb.group({
      loanType: ['PERSONAL', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      termMonths: [12, [Validators.required, Validators.min(1), Validators.max(360)]],
      purpose: [''],
    });
  }

  onSubmit(): void {
    if (!this.form.valid) return;
    const raw = this.form.getRawValue();
    this.loading = true;
    this.loanService
      .apply({
        loanType: raw.loanType,
        amount: Number(raw.amount),
        termMonths: Number(raw.termMonths),
        purpose: raw.purpose?.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.toast.showSuccess('Loan application submitted successfully.');
          this.router.navigate(['/loans']);
          this.loading = false;
        },
        error: (err) => {
          const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Application failed';
          this.toast.showError(msg);
          this.loading = false;
        },
      });
  }
}
