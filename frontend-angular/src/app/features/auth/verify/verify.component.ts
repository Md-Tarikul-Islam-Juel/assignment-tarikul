import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';
import type { SigninSuccessResponse } from '../../../core/models/auth.model';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="card auth-card">
        <h1 class="page-title">Verify your email</h1>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" placeholder="you@example.com" />
          </div>
          <div class="form-group">
            <label for="otp">6-digit OTP</label>
            <input id="otp" type="text" formControlName="otp" placeholder="123456" maxlength="6" />
            @if (form.get('otp')?.invalid && form.get('otp')?.touched) {
              <div class="error">OTP must be 6 digits</div>
            }
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading">
            {{ loading ? 'Verifying...' : 'Verify' }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="resend()" [disabled]="resendLoading" style="margin-left: 0.5rem;">
            {{ resendLoading ? 'Sending...' : 'Resend OTP' }}
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
    .auth-links { margin-top: 1rem; font-size: 0.875rem; }
  `],
})
export class VerifyComponent {
  form: FormGroup;
  loading = false;
  resendLoading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
  ) {
    const email = this.route.snapshot.queryParams['email'] ?? '';
    this.form = this.fb.group({
      email: [email, [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.verifyOtp(this.form.value).subscribe({
      next: (res: SigninSuccessResponse) => {
        if (res.tokens && res.data?.user) {
          this.auth.setSession(res);
          this.router.navigate(['/dashboard']);
        } else {
          this.toast.showError(res.message || 'Verification failed');
        }
        this.loading = false;
      },
      error: (err: { error?: { message?: string; detail?: string }; message?: string }) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Verification failed';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }

  resend(): void {
    const email = this.form.get('email')?.value;
    if (!email) return;
    this.resendLoading = true;
    this.auth.resendOtp(email).subscribe({
      next: () => {
        this.toast.showSuccess('OTP sent. Check your email.');
        this.resendLoading = false;
      },
      error: (err: { error?: { message?: string; detail?: string }; message?: string }) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to resend OTP';
        this.toast.showError(msg);
        this.resendLoading = false;
      },
    });
  }
}
