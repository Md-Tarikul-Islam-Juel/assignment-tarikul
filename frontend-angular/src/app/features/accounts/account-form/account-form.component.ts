import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';
import type { AccountType, Currency } from '../../../core/models/account.model';

const ACCOUNT_TYPES: AccountType[] = ['CHECKING', 'SAVINGS', 'LOAN'];
const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'BDT', 'INR', 'JPY', 'CNY', 'AUD', 'CAD'];

export interface CustomerSuggestion {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container">
      <h1 class="page-title">Create account (Admin/Employee)</h1>
      <p class="muted">Create an account for a customer. Type or select a customer email.</p>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card">
        <div class="form-group autocomplete-wrap">
          <label for="customerEmail">Customer email *</label>
          <input
            id="customerEmail"
            type="text"
            formControlName="customerEmail"
            placeholder="customer@example.com"
            autocomplete="off"
            (focus)="onEmailFocus()"
            (input)="onEmailInput()"
            (blur)="onEmailBlur()"
          />
          @if (showSuggestions && suggestions.length > 0) {
            <ul class="suggestions" role="listbox">
              <ng-container *ngFor="let c of suggestions; trackBy: trackById">
                <li role="option" (click)="selectCustomer(c)" class="suggestion-item">
                  <span class="suggestion-email">{{ c.email }}</span>
                  @if (c.firstName || c.lastName) {
                    <span class="suggestion-name">{{ c.firstName }} {{ c.lastName }}</span>
                  }
                </li>
              </ng-container>
            </ul>
          }
          @if (showSuggestions && suggestions.length === 0 && !loadingSuggestions) {
            <ul class="suggestions suggestions-empty"><li>No customers found</li></ul>
          }
          @if (loadingSuggestions) {
            <div class="suggestions-loading">Searching...</div>
          }
          @if (form.get('customerEmail')?.invalid && form.get('customerEmail')?.touched) {
            <div class="error">{{ getEmailError() }}</div>
          }
        </div>
        <div class="form-group">
          <label for="type">Account type</label>
          <select id="type" formControlName="type">
            @for (t of accountTypes; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        </div>
        <div class="form-group">
          <label for="currency">Currency</label>
          <select id="currency" formControlName="currency">
            @for (c of currencies; track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>
        </div>
        <div class="form-group">
          <label for="interestRate">Interest rate (optional)</label>
          <input id="interestRate" type="number" formControlName="interestRate" placeholder="2.5" step="0.01" min="0" />
        </div>
        <div class="form-group">
          <label for="minimumBalance">Minimum balance (optional)</label>
          <input id="minimumBalance" type="number" formControlName="minimumBalance" placeholder="100" min="0" />
        </div>
        @if (form.get('type')?.value === 'LOAN') {
          <div class="form-group">
            <label for="loanAmount">Loan amount</label>
            <input id="loanAmount" type="number" formControlName="loanAmount" placeholder="10000" min="0" />
          </div>
          <div class="form-group">
            <label for="loanTermMonths">Loan term (months)</label>
            <input id="loanTermMonths" type="number" formControlName="loanTermMonths" placeholder="12" min="1" />
          </div>
        }
        <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading">
          {{ loading ? 'Creating...' : 'Create account' }}
        </button>
        <a routerLink="/accounts" class="btn btn-secondary" style="margin-left: 0.5rem;">Cancel</a>
      </form>
    </div>
  `,
  styles: [`
    .autocomplete-wrap { position: relative; }
    .suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin: 0;
      padding: 0;
      list-style: none;
      background: #fff;
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      max-height: 240px;
      overflow-y: auto;
      z-index: 10;
    }
    .suggestion-item {
      padding: 0.6rem 0.75rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .suggestion-item:hover { background: #f3f4f6; }
    .suggestion-email { font-weight: 500; color: #111; }
    .suggestion-name { font-size: 0.8rem; color: #6b7280; }
    .suggestions-empty li { padding: 0.75rem; color: #6b7280; }
    .suggestions-loading { padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #6b7280; }
  `],
})
export class AccountFormComponent implements OnInit, OnDestroy {
  form: FormGroup;
  accountTypes = ACCOUNT_TYPES;
  currencies = CURRENCIES;
  loading = false;
  suggestions: CustomerSuggestion[] = [];
  showSuggestions = false;
  loadingSuggestions = false;
  private searchSubject = new Subject<string>();
  private sub: unknown;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
  ) {
    this.form = this.fb.group({
      customerEmail: ['', [Validators.required, Validators.email]],
      type: ['CHECKING'],
      currency: ['USD'],
      interestRate: [null as number | null],
      minimumBalance: [null as number | null],
      loanAmount: [null as number | null],
      loanTermMonths: [null as number | null],
    });
  }

  ngOnInit(): void {
    this.sub = this.searchSubject.pipe(
      debounceTime(280),
      distinctUntilChanged(),
      switchMap((q) => {
        this.loadingSuggestions = true;
        return this.auth.getCustomerSuggestions(q, 15);
      })
    ).subscribe({
      next: (res) => {
        this.suggestions = res.data ?? [];
        this.loadingSuggestions = false;
        this.showSuggestions = true;
      },
      error: () => {
        this.loadingSuggestions = false;
        this.showSuggestions = false;
      },
    });
  }

  ngOnDestroy(): void {
    if (this.sub && typeof (this.sub as { unsubscribe?: () => void }).unsubscribe === 'function') {
      (this.sub as { unsubscribe: () => void }).unsubscribe();
    }
  }

  onEmailFocus(): void {
    const v = this.form.get('customerEmail')?.value?.trim();
    this.searchSubject.next(v ?? '');
  }

  onEmailInput(): void {
    const v = this.form.get('customerEmail')?.value?.trim();
    this.searchSubject.next(v ?? '');
  }

  selectCustomer(c: CustomerSuggestion): void {
    this.form.patchValue({ customerEmail: c.email });
    this.showSuggestions = false;
    this.suggestions = [];
  }

  onEmailBlur(): void {
    setTimeout(() => { this.showSuggestions = false; }, 150);
  }

  trackById(_index: number, c: CustomerSuggestion): number {
    return c.id;
  }

  getEmailError(): string {
    const c = this.form.get('customerEmail');
    if (c?.hasError('required')) return 'Customer email is required';
    if (c?.hasError('email')) return 'Enter a valid email address';
    return 'Invalid email';
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const body = {
      customerEmail: raw.customerEmail?.trim() || undefined,
      type: raw.type,
      currency: raw.currency,
      interestRate: raw.interestRate != null && raw.interestRate !== '' ? Number(raw.interestRate) : undefined,
      minimumBalance: raw.minimumBalance != null && raw.minimumBalance !== '' ? Number(raw.minimumBalance) : undefined,
      loanAmount: raw.loanAmount != null && raw.loanAmount !== '' ? Number(raw.loanAmount) : undefined,
      loanTermMonths: raw.loanTermMonths != null && raw.loanTermMonths !== '' ? Number(raw.loanTermMonths) : undefined,
    };
    this.loading = true;
    this.accountService.create(body).subscribe({
      next: () => {
        this.router.navigate(['/accounts']);
        this.loading = false;
      },
      error: (err: { error?: { message?: string; detail?: string }; message?: string }) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to create account';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }
}
