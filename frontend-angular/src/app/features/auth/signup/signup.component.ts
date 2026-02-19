import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="card auth-card">
        <h1 class="page-title">Create account</h1>
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
            <input id="password" type="password" formControlName="password" placeholder="••••••••" />
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <div class="error">Password is required (min 8 chars, mixed case, numbers, special)</div>
            }
          </div>
          <div class="form-group">
            <label for="firstName">First name</label>
            <input id="firstName" type="text" formControlName="firstName" placeholder="John" />
          </div>
          <div class="form-group">
            <label for="lastName">Last name</label>
            <input id="lastName" type="text" formControlName="lastName" placeholder="Doe" />
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading">
            {{ loading ? 'Creating...' : 'Create account' }}
          </button>
        </form>
        <p class="auth-links">
          <a routerLink="/login">Already have an account? Sign in</a>
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
export class SignupComponent {
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
      password: ['', [Validators.required, Validators.minLength(8)]],
      firstName: [''],
      lastName: [''],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.signup(this.form.value).subscribe({
      next: (res: { message: string }) => {
        this.toast.showSuccess(res.message || 'Account created. Please verify your email.');
        this.router.navigate(['/verify'], { queryParams: { email: this.form.get('email')?.value } });
        this.loading = false;
      },
      error: (err: { error?: { message?: string; detail?: string }; message?: string }) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Sign up failed';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }
}
