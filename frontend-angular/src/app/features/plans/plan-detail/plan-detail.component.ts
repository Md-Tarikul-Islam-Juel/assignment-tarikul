import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SavingsPlanService } from '../../../core/services/savings-plan.service';
import { ToastService } from '../../../shared/toast/toast.service';
import type { SavingsPlan } from '../../../core/models/savings-plan.model';

@Component({
  selector: 'app-plan-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      @if (loading) {
        <p>Loading...</p>
      } @else if (plan) {
        <h1 class="page-title">
          {{ plan.planType === 'FIXED_DEPOSIT' ? 'Fixed Deposit' : 'Recurring Deposit' }} #{{ plan.id }}
        </h1>
        <div class="card">
          <dl class="detail-list">
            <dt>Type</dt>
            <dd>{{ plan.planType === 'FIXED_DEPOSIT' ? 'Fixed Deposit' : 'Recurring Deposit' }}</dd>
            <dt>Currency</dt>
            <dd>{{ plan.currency }}</dd>
            @if (plan.planType === 'FIXED_DEPOSIT' && plan.principal != null) {
              <dt>Principal</dt>
              <dd>{{ plan.principal | number:'1.2-2' }} {{ plan.currency }}</dd>
            }
            @if (plan.planType === 'RECURRING_DEPOSIT' && plan.monthlyAmount != null) {
              <dt>Monthly amount</dt>
              <dd>{{ plan.monthlyAmount | number:'1.2-2' }} {{ plan.currency }}</dd>
              <dt>Total deposited</dt>
              <dd>{{ plan.totalDeposited | number:'1.2-2' }} {{ plan.currency }}</dd>
              @if (plan.nextDueDate) {
                <dt>Next due date</dt>
                <dd>{{ plan.nextDueDate | date:'mediumDate' }}</dd>
              }
            }
            <dt>Interest rate</dt>
            <dd>{{ plan.interestRate }}% per year</dd>
            <dt>Term</dt>
            <dd>{{ plan.termMonths }} months</dd>
            <dt>Start date</dt>
            <dd>{{ plan.startDate | date:'mediumDate' }}</dd>
            <dt>End date</dt>
            <dd>{{ plan.endDate | date:'mediumDate' }}</dd>
            <dt>Status</dt>
            <dd><span class="badge status-{{ plan.status.toLowerCase() }}">{{ plan.status }}</span></dd>
            <dt>Interest credited (total)</dt>
            <dd>{{ plan.interestCreditedTotal | number:'1.2-2' }} {{ plan.currency }}</dd>
            @if (plan.lastInterestCreditedAt) {
              <dt>Last interest credited</dt>
              <dd>{{ plan.lastInterestCreditedAt | date:'short' }}</dd>
            }
            <dt>Current value</dt>
            <dd class="current-value">{{ plan.currentValue | number:'1.2-2' }} {{ plan.currency }}</dd>
            <dt>Source account</dt>
            <dd><a [routerLink]="['/accounts', plan.sourceAccountId]">View account #{{ plan.sourceAccountId }}</a></dd>
          </dl>
          <div>
            <a routerLink="/plans" class="btn btn-secondary">Back to list</a>
          </div>
        </div>
      } @else if (!loading) {
        <p class="muted">Plan not found. <a routerLink="/plans">Back to list</a></p>
      }
    </div>
  `,
  styles: [`
    .detail-list { display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1.5rem; margin-bottom: 1rem; }
    .detail-list dt { font-weight: 600; color: var(--color-text-muted); }
    .current-value { font-weight: 700; font-size: 1.125rem; }
    .badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.85rem; }
    .status-active { background: #d1fae5; color: #065f46; }
    .status-matured { background: #e0e7ff; color: #3730a3; }
    .status-closed { background: #f3f4f6; color: #4b5563; }
  `],
})
export class PlanDetailComponent implements OnInit {
  plan: SavingsPlan | null = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private planService: SavingsPlanService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    const planId = Number(id);
    if (Number.isNaN(planId)) return;
    this.loading = true;
    this.planService.getById(planId).subscribe({
      next: (res) => {
        this.plan = (res as { data?: SavingsPlan }).data ?? (res as unknown as SavingsPlan);
        this.loading = false;
      },
      error: (err) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to load plan';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }
}
