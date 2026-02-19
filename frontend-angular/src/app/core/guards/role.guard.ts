import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import type { UserRole } from '../models/auth.model';

export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.hasRole(allowedRoles)) {
      return true;
    }
    router.navigate(['/dashboard']);
    return false;
  };
}
