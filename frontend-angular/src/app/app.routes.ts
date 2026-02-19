import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'signup', loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent) },
  { path: 'verify', loadComponent: () => import('./features/auth/verify/verify.component').then(m => m.VerifyComponent) },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'change-password', loadComponent: () => import('./features/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent) },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'accounts',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/accounts/account-list/account-list.component').then(m => m.AccountListComponent) },
      { path: 'create', loadComponent: () => import('./features/accounts/account-form/account-form.component').then(m => m.AccountFormComponent), canActivate: [roleGuard(['ADMIN', 'EMPLOYEE'])] },
      { path: ':id/deposit', loadComponent: () => import('./features/accounts/account-deposit/account-deposit.component').then(m => m.AccountDepositComponent), canActivate: [roleGuard(['ADMIN', 'EMPLOYEE'])] },
      { path: ':id/withdraw', loadComponent: () => import('./features/accounts/account-withdraw/account-withdraw.component').then(m => m.AccountWithdrawComponent) },
      { path: ':id/transfer', loadComponent: () => import('./features/accounts/account-transfer/account-transfer.component').then(m => m.AccountTransferComponent) },
      { path: ':id/edit', loadComponent: () => import('./features/accounts/account-edit/account-edit.component').then(m => m.AccountEditComponent), canActivate: [roleGuard(['ADMIN', 'EMPLOYEE'])] },
      { path: ':id/history', loadComponent: () => import('./features/accounts/account-history/account-history.component').then(m => m.AccountHistoryComponent) },
      { path: ':id', loadComponent: () => import('./features/accounts/account-detail/account-detail.component').then(m => m.AccountDetailComponent) },
    ],
  },
  {
    path: 'loans',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/loans/loan-list/loan-list.component').then(m => m.LoanListComponent) },
      { path: 'apply', loadComponent: () => import('./features/loans/loan-apply/loan-apply.component').then(m => m.LoanApplyComponent), canActivate: [roleGuard(['CUSTOMER'])] },
      { path: ':id/schedule', loadComponent: () => import('./features/loans/loan-schedule/loan-schedule.component').then(m => m.LoanScheduleComponent) },
      { path: ':id', loadComponent: () => import('./features/loans/loan-detail/loan-detail.component').then(m => m.LoanDetailComponent) },
    ],
  },
  {
    path: 'plans',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/plans/plan-list/plan-list.component').then(m => m.PlanListComponent) },
      { path: 'fixed-deposit', loadComponent: () => import('./features/plans/plan-create-fd/plan-create-fd.component').then(m => m.PlanCreateFdComponent), canActivate: [roleGuard(['CUSTOMER'])] },
      { path: 'recurring-deposit', loadComponent: () => import('./features/plans/plan-create-rd/plan-create-rd.component').then(m => m.PlanCreateRdComponent), canActivate: [roleGuard(['CUSTOMER'])] },
      { path: ':id', loadComponent: () => import('./features/plans/plan-detail/plan-detail.component').then(m => m.PlanDetailComponent) },
    ],
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
    children: [
      { path: '', redirectTo: 'statement', pathMatch: 'full' },
      { path: 'statement', loadComponent: () => import('./features/reports/monthly-statement/monthly-statement.component').then(m => m.MonthlyStatementComponent) },
      { path: 'summary', loadComponent: () => import('./features/reports/account-summary-report/account-summary-report.component').then(m => m.AccountSummaryReportComponent) },
      { path: 'loan-balances', loadComponent: () => import('./features/reports/loan-balances-report/loan-balances-report.component').then(m => m.LoanBalancesReportComponent) },
      { path: 'transaction-history', loadComponent: () => import('./features/reports/transaction-history-report/transaction-history-report.component').then(m => m.TransactionHistoryReportComponent) },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    children: [
      { path: 'create-employee', loadComponent: () => import('./features/admin/create-employee/create-employee.component').then(m => m.CreateEmployeeComponent) },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
