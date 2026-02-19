import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AccountService } from '../../core/services/account.service';
import { ToastService } from '../../shared/toast/toast.service';
import type { Account } from '../../core/models/account.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <!-- Welcome Section -->
      <div class="welcome-section">
        <div class="welcome-content">
          <h1 class="welcome-title">
            Welcome back, <span class="highlight">{{ auth.user()?.firstName || 'User' }}</span>!
          </h1>
          <p class="welcome-subtitle">
            {{ getWelcomeMessage() }}
          </p>
        </div>
        <div class="welcome-badge">
          <span class="badge-label">Role</span>
          <span class="badge-value">{{ auth.role() }}</span>
        </div>
      </div>

      <!-- Stats Cards -->
      @if (!loading && accounts.length > 0) {
        <div class="stats-grid">
          <div class="stat-card stat-primary">
            <div class="stat-icon">💰</div>
            <div class="stat-content">
              <div class="stat-label">Total Balance</div>
              <div class="stat-value">{{ totalBalance() | number:'1.2-2' }} {{ primaryCurrency() }}</div>
            </div>
          </div>
          <div class="stat-card stat-secondary">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-label">Total Accounts</div>
              <div class="stat-value">{{ accounts.length }}</div>
            </div>
          </div>
          <div class="stat-card stat-success">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <div class="stat-label">Active Accounts</div>
              <div class="stat-value">{{ activeAccountsCount() }}</div>
            </div>
          </div>
          <div class="stat-card stat-info">
            <div class="stat-icon">💳</div>
            <div class="stat-content">
              <div class="stat-label">Available Balance</div>
              <div class="stat-value">{{ totalAvailableBalance() | number:'1.2-2' }} {{ primaryCurrency() }}</div>
            </div>
          </div>
        </div>
      }

      <!-- Quick Actions -->
      <div class="section">
        <h2 class="section-title">Quick Actions</h2>
        <div class="actions-grid">
          <a routerLink="/accounts" class="action-card">
            <div class="action-icon">📋</div>
            <div class="action-content">
              <h3>View Accounts</h3>
              <p>See all your accounts and balances</p>
            </div>
            <div class="action-arrow">→</div>
          </a>
          @if (auth.role() === 'CUSTOMER') {
            <a routerLink="/loans/apply" class="action-card">
              <div class="action-icon">💰</div>
              <div class="action-content">
                <h3>Apply for loan</h3>
                <p>Submit a new loan application</p>
              </div>
              <div class="action-arrow">→</div>
            </a>
            <a routerLink="/plans/fixed-deposit" class="action-card">
              <div class="action-icon">📌</div>
              <div class="action-content">
                <h3>Open Fixed Deposit</h3>
                <p>Lock funds and earn interest</p>
              </div>
              <div class="action-arrow">→</div>
            </a>
            <a routerLink="/plans/recurring-deposit" class="action-card">
              <div class="action-icon">📅</div>
              <div class="action-content">
                <h3>Open Recurring Deposit</h3>
                <p>Save monthly with interest</p>
              </div>
              <div class="action-arrow">→</div>
            </a>
          }
          @if (auth.canCreateAccount()) {
            <a routerLink="/accounts/create" class="action-card">
              <div class="action-icon">➕</div>
              <div class="action-content">
                <h3>Create Account</h3>
                <p>Create a new account for a customer</p>
              </div>
              <div class="action-arrow">→</div>
            </a>
          }
          @if (auth.isAdmin()) {
            <a routerLink="/admin/create-employee" class="action-card">
              <div class="action-icon">👤</div>
              <div class="action-content">
                <h3>Create Employee</h3>
                <p>Add a new employee to the system</p>
              </div>
              <div class="action-arrow">→</div>
            </a>
          }
        </div>
      </div>

      <!-- Accounts Preview -->
      @if (!loading) {
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">My Accounts</h2>
            <a routerLink="/accounts" class="view-all-link">View All →</a>
          </div>
          @if (accounts.length > 0) {
            <div class="accounts-grid">
              @for (account of accounts.slice(0, 6); track account.id) {
                <div class="account-card" [class]="'account-' + account.type.toLowerCase()">
                  <div class="account-header">
                    <div class="account-type-badge">{{ account.type }}</div>
                    <div class="account-status" [class]="'status-' + account.status.toLowerCase()">
                      {{ account.status }}
                    </div>
                  </div>
                  <div class="account-number">{{ account.accountNumber }}</div>
                  <div class="account-balance">
                    <span class="balance-label">Balance</span>
                    <span class="balance-value">{{ account.balance | number:'1.2-2' }} {{ account.currency }}</span>
                  </div>
                  <div class="account-footer">
                    <a [routerLink]="['/accounts', account.id]" class="account-link">View Details →</a>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <div class="empty-icon">📭</div>
              <p class="empty-text">No accounts found</p>
              @if (auth.canCreateAccount()) {
                <a routerLink="/accounts/create" class="empty-action">Create Your First Account</a>
              }
            </div>
          }
        </div>
      }

      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    /* Welcome Section */
    .welcome-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 1rem;
      color: white;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }

    .welcome-content {
      flex: 1;
    }

    .welcome-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
    }

    .highlight {
      color: #ffd700;
    }

    .welcome-subtitle {
      font-size: 1.1rem;
      opacity: 0.95;
      margin: 0;
    }

    .welcome-badge {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      padding: 1rem 1.5rem;
      border-radius: 0.75rem;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .badge-label {
      display: block;
      font-size: 0.875rem;
      opacity: 0.9;
      margin-bottom: 0.25rem;
    }

    .badge-value {
      display: block;
      font-size: 1.25rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 1rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: transform 0.2s, box-shadow 0.2s;
      border-left: 4px solid;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    }

    .stat-primary { border-color: #667eea; }
    .stat-secondary { border-color: #764ba2; }
    .stat-success { border-color: #10b981; }
    .stat-info { border-color: #3b82f6; }

    .stat-icon {
      font-size: 2.5rem;
      line-height: 1;
    }

    .stat-content {
      flex: 1;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.25rem;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #111827;
    }

    /* Section */
    .section {
      margin-bottom: 3rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .view-all-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s;
    }

    .view-all-link:hover {
      color: #764ba2;
    }

    /* Actions Grid */
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .action-card {
      background: white;
      padding: 1.5rem;
      border-radius: 1rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      text-decoration: none;
      color: inherit;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.2s;
      border: 2px solid transparent;
    }

    .action-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      border-color: #667eea;
    }

    .action-icon {
      font-size: 2rem;
      width: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 0.75rem;
      flex-shrink: 0;
    }

    .action-content {
      flex: 1;
    }

    .action-content h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
    }

    .action-content p {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .action-arrow {
      font-size: 1.5rem;
      color: #9ca3af;
      transition: transform 0.2s;
    }

    .action-card:hover .action-arrow {
      transform: translateX(4px);
      color: #667eea;
    }

    /* Accounts Grid */
    .accounts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .account-card {
      background: white;
      padding: 1.5rem;
      border-radius: 1rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s, box-shadow 0.2s;
      border-top: 4px solid;
    }

    .account-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    }

    .account-checking { border-color: #3b82f6; }
    .account-savings { border-color: #10b981; }
    .account-loan { border-color: #f59e0b; }

    .account-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .account-type-badge {
      background: #f3f4f6;
      color: #374151;
      padding: 0.375rem 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .account-status {
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-active { background: #d1fae5; color: #065f46; }
    .status-inactive { background: #fee2e2; color: #991b1b; }
    .status-closed { background: #e5e7eb; color: #374151; }
    .status-frozen { background: #fef3c7; color: #92400e; }

    .account-number {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 1rem;
      font-family: monospace;
    }

    .account-balance {
      margin-bottom: 1rem;
    }

    .balance-label {
      display: block;
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.25rem;
    }

    .balance-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
    }

    .account-footer {
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .account-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.875rem;
      transition: color 0.2s;
    }

    .account-link:hover {
      color: #764ba2;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      background: white;
      border-radius: 1rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-text {
      font-size: 1.125rem;
      color: #6b7280;
      margin-bottom: 1rem;
    }

    .empty-action {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 0.5rem;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .empty-action:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: 3rem;
    }

    .spinner {
      width: 3rem;
      height: 3rem;
      border: 4px solid #e5e7eb;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .welcome-section {
        flex-direction: column;
        text-align: center;
        gap: 1.5rem;
      }

      .welcome-title {
        font-size: 1.5rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .actions-grid,
      .accounts-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class DashboardComponent implements OnInit {
  accounts: Account[] = [];
  loading = true;

  totalBalance = computed(() => {
    return this.accounts.reduce((sum, acc) => sum + acc.balance, 0);
  });

  totalAvailableBalance = computed(() => {
    return this.accounts.reduce((sum, acc) => sum + acc.availableBalance, 0);
  });

  activeAccountsCount = computed(() => {
    return this.accounts.filter(acc => acc.status === 'ACTIVE').length;
  });

  primaryCurrency = computed(() => {
    if (this.accounts.length === 0) return 'USD';
    const currencies = this.accounts.map(a => a.currency);
    return currencies[0] || 'USD';
  });

  constructor(
    public auth: AuthService,
    private accountService: AccountService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading = true;
    const params = this.auth.isCustomer() ? { limit: 50, offset: 0 } : { limit: 50, offset: 0 };
    this.accountService.list(params).subscribe({
      next: (res) => {
        this.accounts = res.data;
        this.loading = false;
      },
      error: (err: { error?: { message?: string; detail?: string }; message?: string }) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to load accounts';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }

  getWelcomeMessage(): string {
    const role = this.auth.role();
    if (role === 'ADMIN') {
      return 'Manage your bank operations, employees, and accounts from here.';
    } else if (role === 'EMPLOYEE') {
      return 'Create and manage customer accounts efficiently.';
    } else {
      return 'View your accounts, balances, and transaction history.';
    }
  }
}
