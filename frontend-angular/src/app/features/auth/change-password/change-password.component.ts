import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="card auth-card">
        <h1 class="page-title">{{ isRecovery ? 'Set new password' : 'Change password' }}</h1>
        <p class="muted">{{ isRecovery ? 'Enter your new password to complete account recovery.' : 'After forgot-password flow: only new password is required. Otherwise provide old and new.' }}</p>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          @if (!isRecovery) {
            <div class="form-group">
              <label for="oldPassword">Old password</label>
              <input id="oldPassword" type="password" formControlName="oldPassword" placeholder="••••••••" />
            </div>
          }
          <div class="form-group">
            <label for="newPassword">New password</label>
            <input id="newPassword" type="password" formControlName="newPassword" placeholder="••••••••" />
            @if (form.get('newPassword')?.invalid && form.get('newPassword')?.touched) {
              <div class="error">Required, min 8 characters</div>
            }
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="form.get('newPassword')?.invalid || loading">
            {{ loading ? 'Updating...' : (isRecovery ? 'Reset password' : 'Update password') }}
          </button>
        </form>
        <p class="auth-links">
          @if (isRecovery) {
            <a routerLink="/login">Back to sign in</a>
          } @else {
            <a routerLink="/dashboard">Back to dashboard</a>
          }
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
export class ChangePasswordComponent {
  form: FormGroup;
  loading = false;

  isRecovery = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService,
  ) {
    this.isRecovery = this.route.snapshot.queryParams['recovery'] === '1';
    this.form = this.fb.group({
      oldPassword: [''],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit(): void {
    const payload: { oldPassword?: string; newPassword: string } = {
      newPassword: this.form.get('newPassword')?.value,
    };
    if (this.form.get('oldPassword')?.value) {
      payload.oldPassword = this.form.get('oldPassword')?.value;
    }
    this.loading = true;
    this.auth.changePassword(payload).subscribe({
      next: (res: { message: string }) => {
        this.toast.showSuccess(res.message || 'Password updated.');
        this.loading = false;
        if (this.isRecovery) {
          this.auth.clearSession();
          setTimeout(() => this.router.navigate(['/login']), 1500);
        } else {
          setTimeout(() => this.router.navigate(['/dashboard']), 1500);
        }
      },
      error: (err: { error?: { message?: string; detail?: string }; message?: string }) => {
        const msg = err.error?.message ?? err.error?.detail ?? err.message ?? 'Failed to update password';
        this.toast.showError(msg);
        this.loading = false;
      },
    });
  }
}
