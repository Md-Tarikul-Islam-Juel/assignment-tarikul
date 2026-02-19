import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../core/services/account.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';
import type { Account } from '../../../core/models/account.model';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container accounts-page">
      <div class="page-header">
        <h1 class="page-title">Accounts</h1>
        @if (auth.canCreateAccount()) {
          <a routerLink="/accounts/create" class="btn btn-primary">Create account</a>
        }
      </div>
      @if (auth.canCreateAccount()) {
        <p class="muted">As staff you can filter by user. Customers see only their own accounts.</p>
      }

      @if (loading) {
        <div class="loading-wrap">
          <div class="spinner"></div>
          <p>Loading accounts...</p>
        </div>
      } @else {
        <div class="table-card">
          <div class="table-wrap">
            <table class="accounts-table">
              <thead>
                <tr>
                  <th>Account #</th>
                  <th>Type</th>
                  <th>Currency</th>
                  <th>Email</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (a of accounts; track a.id) {
                  <tr>
                    <td><span class="account-number">{{ a.accountNumber }}</span></td>
                    <td><span class="badge badge-{{ a.type.toLowerCase() }}">{{ a.type }}</span></td>
                    <td>{{ a.currency }}</td>
                    <td>{{ a.ownerEmail ?? '—' }}</td>
                    <td class="balance">{{ a.balance | number:'1.2-2' }} {{ a.currency }}</td>
                    <td><span class="badge status-{{ a.status.toLowerCase() }}">{{ a.status }}</span></td>
                    <td class="actions-column">
                      <a [routerLink]="['/accounts', a.id]" class="action-link">View</a>
                      <a [routerLink]="['/accounts', a.id, 'history']" class="action-link">History</a>
                      @if (auth.canUpdateAccount()) {
                        <a [routerLink]="['/accounts', a.id, 'edit']" class="action-link">Edit</a>
                      }
                      @if (auth.canDeleteAccount()) {
                        <button type="button" class="action-link action-link-danger" (click)="confirmDelete(a)">Delete</button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (accounts.length === 0) {
            <div class="empty-message">No accounts found.</div>
          } @else {
            <div class="pagination-bar">
              <div class="pagination-info">
                Showing {{ fromRecord }}–{{ toRecord }} of {{ total }}
              </div>
              <div class="pagination-controls">
                <label class="page-size-label">
                  Per page
                  <select [(ngModel)]="pageSize" (ngModelChange)="onPageSizeChange($event)">
                    @for (size of pageSizeOptions; track size) {
                      <option [value]="size">{{ size }}</option>
                    }
                  </select>
                </label>
                <div class="page-nav">
                  <button
                    type="button"
                    class="btn btn-secondary btn-sm"
                    [disabled]="page <= 1"
                    (click)="goToPage(1)"
                    aria-label="First page"
                  >
                    «
                  </button>
                  <button
                    type="button"
                    class="btn btn-secondary btn-sm"
                    [disabled]="page <= 1"
                    (click)="goToPage(page - 1)"
                    aria-label="Previous page"
                  >
                    ‹
                  </button>
                  <span class="page-indicator">Page {{ page }} of {{ totalPages }}</span>
                  <button
                    type="button"
                    class="btn btn-secondary btn-sm"
                    [disabled]="page >= totalPages"
                    (click)="goToPage(page + 1)"
                    aria-label="Next page"
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    class="btn btn-secondary btn-sm"
                    [disabled]="page >= totalPages"
                    (click)="goToPage(totalPages)"
                    aria-label="Last page"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .accounts-page { max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 0.5rem; }
    .table-card { background: #fff; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
    .table-wrap { overflow-x: auto; overflow-y: visible; }
    .accounts-table { width: 100%; border-collapse: collapse; border-spacing: 0; }
    .accounts-table th,
    .accounts-table td { padding: 0.75rem 1rem; text-align: left; box-sizing: border-box; border-bottom: 1px solid #e5e7eb; vertical-align: middle; line-height: 1.5; }
    .accounts-table th { background: #f9fafb; font-weight: 600; color: #374151; font-size: 0.875rem; text-align: center; }
    .accounts-table tbody tr:hover { background: #f9fafb; }
    .account-number { font-family: ui-monospace, monospace; font-size: 0.875rem; }
    .balance { font-weight: 500; white-space: nowrap; }
    .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; }
    .badge-checking { background: #dbeafe; color: #1e40af; }
    .badge-savings { background: #d1fae5; color: #065f46; }
    .badge-loan { background: #fef3c7; color: #92400e; }
    .status-active { background: #d1fae5; color: #065f46; }
    .status-inactive { background: #fee2e2; color: #991b1b; }
    .status-closed { background: #e5e7eb; color: #374151; }
    .status-frozen { background: #fef3c7; color: #92400e; }
    .actions-column { text-align: left; }
    .action-link { 
      display: inline-block;
      color: #2563eb; 
      text-decoration: none; 
      font-size: 0.875rem; 
      padding: 0.375rem 0.75rem;
      background-color: #dbeafe;
      border: 1px solid #93c5fd;
      border-radius: 0.375rem;
      margin-right: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .action-link:last-child { margin-right: 0; }
    .action-link:hover { 
      background-color: #bfdbfe;
      border-color: #60a5fa;
      text-decoration: none;
    }
    .action-link-danger { 
      color: #dc2626; 
      background-color: #fee2e2;
      border: 1px solid #fca5a5;
      cursor: pointer; 
      font-size: 0.875rem;
      display: inline-block;
      padding: 0.375rem 0.75rem;
      border-radius: 0.375rem;
      margin-right: 0.5rem;
      transition: all 0.2s;
    }
    .action-link-danger:hover { 
      background-color: #fecaca;
      border-color: #f87171;
      color: #b91c1c;
    }
    .empty-message { padding: 2rem; text-align: center; color: #6b7280; }
    .loading-wrap { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; }
    .spinner { width: 2.5rem; height: 2.5rem; border: 3px solid #e5e7eb; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .pagination-bar { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem 1rem; border-top: 1px solid #e5e7eb; background: #fafafa; }
    .pagination-info { font-size: 0.875rem; color: #6b7280; }
    .pagination-controls { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .page-size-label { font-size: 0.875rem; color: #374151; display: flex; align-items: center; gap: 0.5rem; }
    .page-size-label select { padding: 0.35rem 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; }
    .page-nav { display: flex; align-items: center; gap: 0.25rem; }
    .page-nav .btn-sm { min-width: 2rem; padding: 0.35rem 0.5rem; }
    .page-indicator { font-size: 0.875rem; color: #374151; margin: 0 0.5rem; }
  `],
})
export class AccountListComponent implements OnInit {
  accounts: Account[] = [];
  total = 0;
  limit = 10;
  offset = 0;
  loading = false;
  page = 1;
  pageSize = 10;
  pageSizeOptions = PAGE_SIZE_OPTIONS;

  get totalPages(): number {
    if (this.total <= 0 || this.pageSize <= 0) return 1;
    return Math.ceil(this.total / this.pageSize);
  }

  get fromRecord(): number {
    if (this.total === 0) return 0;
    return this.offset + 1;
  }

  get toRecord(): number {
    return Math.min(this.offset + this.accounts.length, this.total);
  }

  constructor(
    private accountService: AccountService,
    public auth: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadPage();
  }

  loadPage(): void {
    this.loading = true;
    const params = this.auth.isCustomer()
      ? { limit: this.pageSize, offset: this.offset }
      : { limit: this.pageSize, offset: this.offset };
    this.accountService.list(params).subscribe({
      next: (res) => {
        this.accounts = res.data ?? [];
        this.total = res.total ?? 0;
        this.limit = res.limit ?? this.pageSize;
        this.offset = res.offset ?? 0;
        this.page = this.limit > 0 ? Math.floor(this.offset / this.limit) + 1 : 1;
        this.loading = false;
      },
      error: (err: { error?: { message?: string; detail?: string }; message?: string }) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to load accounts';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }

  goToPage(p: number): void {
    const target = Math.max(1, Math.min(p, this.totalPages));
    if (target === this.page) return;
    this.page = target;
    this.offset = (this.page - 1) * this.pageSize;
    this.loadPage();
  }

  onPageSizeChange(newSize: number | string): void {
    const size = typeof newSize === 'string' ? parseInt(newSize, 10) : newSize;
    if (size === this.pageSize || Number.isNaN(size)) return;
    this.pageSize = size;
    this.page = 1;
    this.offset = 0;
    this.loadPage();
  }

  confirmDelete(account: Account): void {
    if (!window.confirm(`Delete account ${account.accountNumber}? This action cannot be undone.`)) return;
    this.accountService.delete(account.id).subscribe({
      next: () => {
        this.toast.showSuccess('Account deleted.');
        this.loadPage();
      },
      error: (err: { error?: { message?: string; detail?: string }; message?: string }) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to delete account';
        this.toast.showError(msg);
      },
    });
  }
}
