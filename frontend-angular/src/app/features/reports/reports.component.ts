import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="container">
      <h1 class="page-title">Reports & Statements</h1>
      <p class="muted">Monthly statements, account summary, loan balances and transaction history.</p>
      <nav class="report-tabs">
        <a routerLink="/reports/statement" routerLinkActive="active" class="tab">Monthly Statement</a>
        <a routerLink="/reports/summary" routerLinkActive="active" class="tab">Account Summary</a>
        <a routerLink="/reports/loan-balances" routerLinkActive="active" class="tab">Loan Balances</a>
        <a routerLink="/reports/transaction-history" routerLinkActive="active" class="tab">Transaction History</a>
      </nav>
      <router-outlet />
    </div>
  `,
  styles: [`
    .report-tabs { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border, #e5e7eb); padding-bottom: 0.5rem; }
    .tab { padding: 0.5rem 1rem; border-radius: 6px; text-decoration: none; color: inherit; font-weight: 500; }
    .tab:hover { background: #f3f4f6; }
    .tab.active { background: var(--primary, #2563eb); color: white; }
  `],
})
export class ReportsComponent {}
