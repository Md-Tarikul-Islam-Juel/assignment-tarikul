import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';
import { catchError, throwError } from 'rxjs';

/** Only attach token to requests to our versioned API (e.g. /v1/... or .../v1/...). */
function isApiRequest(url: string): boolean {
  const base = environment.apiBaseUrl ?? '/v1';
  return url.startsWith(base) || url.startsWith('/v1') || url.includes('/v1/');
}

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();
  if (token && isApiRequest(req.url)) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};

/** On 401 (expired/invalid token): clear session and redirect to login. No refresh token API call or token persistence. */
function isAuthUrl(url: string): boolean {
  return url.includes('/auth/') || url.includes('/admin/');
}

export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || isAuthUrl(req.url)) {
        return throwError(() => err);
      }
      auth.clearSession();
      router.navigateByUrl('/login?session=expired');
      return throwError(() => err);
    }),
  );
};
