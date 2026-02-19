import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="card auth-card">
        <h1 class="page-title">Forgot password</h1>
        <p class="muted">Enter your email and we'll send you an OTP to reset your password.</p>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" placeholder="you@example.com" />
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <div class="error">Valid email is required</div>
            }
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading">
            {{ loading ? 'Sending...' : 'Send OTP' }}
          </button>
        </form>
        <p class="auth-links">
          <a routerLink="/login">Back to sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; justify-content: center; align-items: center; min-height: 80vh; padding: 1rem; }
    .auth-card { max-width: 400px; width: 100%; }
    .muted { color: var(--color-text-muted); font-size: 0.875rem; margin-bottom: 1rem; }
    .auth-links { margin-top: 1rem; font-size: 0.875rem; }
  `],
})
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toast: ToastService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.forgetPassword(this.form.get('email')?.value).subscribe({
      next: (res: { message: string }) => {
        this.toast.showSuccess(res.message || 'OTP sent. Check your email, then verify and set a new password.');
        this.loading = false;
      },
      error: (err: { error?: { message?: string; detail?: string }; message?: string }) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to send OTP';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }
}
