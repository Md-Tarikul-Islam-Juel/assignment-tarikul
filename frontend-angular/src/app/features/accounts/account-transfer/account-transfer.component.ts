import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../shared/toast/toast.service';
import type { Account } from '../../../core/models/account.model';

@Component({
  selector: 'app-account-transfer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container">
      <h1 class="page-title">Transfer</h1>
      @if (account) {
        <p class="muted">From {{ account.accountNumber }} · Available: {{ account.availableBalance | number:'1.2-2' }} {{ account.currency }}</p>
      }
      @if (form && accountId != null) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card">
          <div class="form-group">
            <label for="toAccountNumber">Destination account number</label>
            <input id="toAccountNumber" type="text" formControlName="toAccountNumber" placeholder="ACCT..." />
          </div>
          <div class="form-group">
            <label for="amount">Amount</label>
            <input id="amount" type="number" formControlName="amount" step="0.01" min="0.01" />
            @if (account) {
              <span class="form-hint">{{ account.currency }} (fees may apply)</span>
            }
          </div>
          <div class="form-group">
            <label for="description">Description (optional)</label>
            <input id="description" type="text" formControlName="description" placeholder="e.g. Payment for..." />
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading">
            {{ loading ? 'Processing...' : 'Transfer' }}
          </button>
          <a [routerLink]="['/accounts', accountId]" class="btn btn-secondary" style="margin-left: 0.5rem;">Cancel</a>
        </form>
      }
    </div>
  `,
  styles: [`.form-hint { margin-left: 0.5rem; color: var(--color-text-muted); }`],
})
export class AccountTransferComponent implements OnInit {
  form!: FormGroup;
  account: Account | null = null;
  accountId: number | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private accountService: AccountService,
    private router: Router,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.accountId = Number(id);
    this.loading = true;
    this.accountService.getById(this.accountId).subscribe({
      next: (res) => {
        this.account = res.data;
        this.form = this.fb.group({
          toAccountNumber: ['', [Validators.required, Validators.minLength(1)]],
          amount: [null, [Validators.required, Validators.min(0.01)]],
          description: [''],
        });
        this.loading = false;
      },
      error: (err: { error?: { message?: string; detail?: string }; message?: string }) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to load account';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (!this.form.valid || this.accountId == null) return;
    const raw = this.form.getRawValue();
    this.loading = true;
    this.accountService.transfer(this.accountId, {
      toAccountNumber: raw.toAccountNumber.trim(),
      amount: Number(raw.amount),
      description: raw.description?.trim() || undefined,
    }).subscribe({
      next: (res) => {
        let msg = `Transfer successful. Reference: ${res.referenceNumber}`;
        if (res.fee > 0) msg += ` (Fee: ${res.fee.toFixed(2)})`;
        this.toast.showSuccess(msg);
        this.router.navigate(['/accounts', this.accountId]);
        this.loading = false;
      },
      error: (err: { error?: { message?: string; detail?: string }; message?: string }) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Transfer failed';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }
}
