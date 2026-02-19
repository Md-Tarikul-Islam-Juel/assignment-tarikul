import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-create-employee',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="container">
      <h1 class="page-title">Create employee (Admin only)</h1>
      <p class="muted">Staff do not sign up; only admins can create employee accounts.</p>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card">
        <div class="form-group">
          <label for="email">Email *</label>
          <input id="email" type="email" formControlName="email" placeholder="employee@bank.com" />
          @if (form.get('email')?.invalid && form.get('email')?.touched) {
            <div class="error">Valid email is required</div>
          }
        </div>
        <div class="form-group">
          <label for="password">Password *</label>
          <input id="password" type="password" formControlName="password" placeholder="••••••••" />
          @if (form.get('password')?.invalid && form.get('password')?.touched) {
            <div class="error">Password is required</div>
          }
        </div>
        <div class="form-group">
          <label for="firstName">First name</label>
          <input id="firstName" type="text" formControlName="firstName" placeholder="Jane" />
        </div>
        <div class="form-group">
          <label for="lastName">Last name</label>
          <input id="lastName" type="text" formControlName="lastName" placeholder="Smith" />
        </div>
        <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading">
          {{ loading ? 'Creating...' : 'Create employee' }}
        </button>
        <a routerLink="/dashboard" class="btn btn-secondary" style="margin-left: 0.5rem;">Cancel</a>
      </form>
    </div>
  `,
})
export class CreateEmployeeComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      firstName: [''],
      lastName: [''],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.createEmployee(this.form.value).subscribe({
      next: (res: { success: boolean; message: string }) => {
        this.toast.showSuccess(res.message || 'Employee created.');
        this.form.reset();
        this.loading = false;
      },
      error: (err: { error?: { message?: string; detail?: string }; message?: string }) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to create employee';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }
}
