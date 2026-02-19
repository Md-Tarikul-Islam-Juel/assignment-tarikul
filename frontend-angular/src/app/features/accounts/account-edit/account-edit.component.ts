import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { ToastService } from '../../../shared/toast/toast.service';
import type { AccountStatus } from '../../../core/models/account.model';

const STATUSES: AccountStatus[] = ['ACTIVE', 'INACTIVE', 'CLOSED', 'FROZEN'];

@Component({
  selector: 'app-account-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container">
      <h1 class="page-title">Edit account</h1>
      @if (form && accountId) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card">
          <div class="form-group">
            <label for="status">Status</label>
            <select id="status" formControlName="status">
              @for (s of statuses; track s) {
                <option [value]="s">{{ s }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label for="interestRate">Interest rate</label>
            <input id="interestRate" type="number" formControlName="interestRate" step="0.01" min="0" />
          </div>
          <div class="form-group">
            <label for="minimumBalance">Minimum balance</label>
            <input id="minimumBalance" type="number" formControlName="minimumBalance" min="0" />
          </div>
          <div class="form-group">
            <label for="dailyWithdrawalLimit">Daily withdrawal limit</label>
            <input id="dailyWithdrawalLimit" type="number" formControlName="dailyWithdrawalLimit" min="0" step="0.01" placeholder="Optional" />
          </div>
          <div class="form-group">
            <label for="transferFeePercent">Transfer fee %</label>
            <input id="transferFeePercent" type="number" formControlName="transferFeePercent" min="0" step="0.01" placeholder="e.g. 0.5" />
          </div>
          <div class="form-group">
            <label for="transferFeeFixed">Transfer fee (fixed)</label>
            <input id="transferFeeFixed" type="number" formControlName="transferFeeFixed" min="0" step="0.01" placeholder="Optional" />
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading">
            {{ loading ? 'Saving...' : 'Save' }}
          </button>
          <a [routerLink]="['/accounts', accountId]" class="btn btn-secondary" style="margin-left: 0.5rem;">Cancel</a>
        </form>
      }
    </div>
  `,
})
export class AccountEditComponent implements OnInit {
  form!: FormGroup;
  accountId: number | null = null;
  statuses = STATUSES;
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
        const a = res.data;
        this.form = this.fb.group({
          status: [a.status],
          interestRate: [a.interestRate],
          minimumBalance: [a.minimumBalance],
          dailyWithdrawalLimit: [a.dailyWithdrawalLimit],
          transferFeePercent: [a.transferFeePercent],
          transferFeeFixed: [a.transferFeeFixed],
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
    const body = {
      status: raw.status,
      interestRate: raw.interestRate != null && raw.interestRate !== '' ? Number(raw.interestRate) : undefined,
      minimumBalance: raw.minimumBalance != null && raw.minimumBalance !== '' ? Number(raw.minimumBalance) : undefined,
      dailyWithdrawalLimit: raw.dailyWithdrawalLimit != null && raw.dailyWithdrawalLimit !== '' ? Number(raw.dailyWithdrawalLimit) : undefined,
      transferFeePercent: raw.transferFeePercent != null && raw.transferFeePercent !== '' ? Number(raw.transferFeePercent) : undefined,
      transferFeeFixed: raw.transferFeeFixed != null && raw.transferFeeFixed !== '' ? Number(raw.transferFeeFixed) : undefined,
    };
    this.loading = true;
    this.accountService.update(this.accountId, body).subscribe({
      next: () => {
        this.router.navigate(['/accounts', this.accountId]);
        this.loading = false;
      },
      error: (err: { error?: { message?: string; detail?: string }; message?: string }) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to update account';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }
}
