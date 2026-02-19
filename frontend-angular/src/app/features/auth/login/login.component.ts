import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';
import type { SigninSuccessResponse } from '../../../core/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="card auth-card">
        <h1 class="page-title">Sign in</h1>
        @if (sessionExpired) {
          <p class="session-expired">Your session expired or the token was invalid. Please sign in again.</p>
        }
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" placeholder="you@example.com" />
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <div class="error">Valid email is required</div>
            }
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <div class="password-wrap">
              <input
                id="password"
                [type]="hidePassword ? 'password' : 'text'"
                formControlName="password"
                placeholder="••••••••"
              />
              <button type="button" class="password-toggle" (click)="hidePassword = !hidePassword" tabindex="-1" [attr.aria-label]="hidePassword ? 'Show password' : 'Hide password'" title="{{ hidePassword ? 'Show password' : 'Hide password' }}">
                @if (hidePassword) {
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                }
              </button>
            </div>
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <div class="error">Password is required</div>
            }
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading">
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>
        <p class="auth-links">
          <a routerLink="/forgot-password">Forgot password?</a>
          <a routerLink="/signup">Create account</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; justify-content: center; align-items: center; min-height: 80vh; padding: 1rem; }
    .auth-card { max-width: 400px; width: 100%; }
    .auth-links { display: flex; justify-content: space-between; margin-top: 1rem; font-size: 0.875rem; }
    .password-wrap {
      display: flex;
      align-items: center;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-card);
    }
    .password-wrap:focus-within {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15);
    }
    .password-wrap input {
      flex: 1;
      border: none;
      padding: 0.5rem 0.75rem;
      background: transparent;
    }
    .password-wrap input:focus {
      outline: none;
      box-shadow: none;
    }
    .password-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 0.75rem;
      border: none;
      background: transparent;
      color: var(--color-text-muted);
      cursor: pointer;
      border-radius: 0 var(--radius) var(--radius) 0;
    }
    .password-toggle:hover {
      color: var(--color-primary);
    }
    .session-expired {
      padding: 0.5rem 0.75rem;
      background: #fef3c7;
      color: #92400e;
      border-radius: 6px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
  `],
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  hidePassword = true;
  loading = false;
  sessionExpired = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.sessionExpired = this.route.snapshot.queryParamMap.get('session') === 'expired';
    if (this.sessionExpired) {
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, queryParamsHandling: '' });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.signin(this.form.value).subscribe({
      next: (res: SigninSuccessResponse) => {
        if (res.tokens && res.data?.user) {
          this.auth.setSession(res);
          // Defer navigation so localStorage and signals are committed before any subsequent request
          queueMicrotask(() => this.router.navigate(['/dashboard']));
        } else if (res.message?.toLowerCase().includes('verify')) {
          this.toast.showSuccess('Please verify your email. Check your inbox for the OTP.');
          this.router.navigate(['/verify'], { queryParams: { email: this.form.get('email')?.value } });
        } else {
          this.toast.showError(res.message || 'Sign in failed');
        }
        this.loading = false;
      },
      error: (err: { error?: { message?: string; detail?: string }; message?: string }) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Sign in failed';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }
}
