import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import type {
  User,
  UserRole,
  Tokens,
  SigninRequest,
  SigninSuccessResponse,
  SignupRequest,
  SignupSuccessResponse,
  VerificationRequest,
  ChangePasswordRequest,
  CreateEmployeeRequest,
} from '../models/auth.model';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSignal = signal<User | null>(null);
  private readonly tokensSignal = signal<Tokens | null>(null);

  readonly user = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => !!this.userSignal());
  readonly role = computed(() => this.userSignal()?.role ?? null);

  constructor(
    private api: ApiService,
    private http: HttpClient,
    private router: Router,
  ) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const at = localStorage.getItem(ACCESS_TOKEN_KEY);
    const rt = localStorage.getItem(REFRESH_TOKEN_KEY);
    const u = localStorage.getItem(USER_KEY);
    if (at && rt) {
      this.tokensSignal.set({ accessToken: at, refreshToken: rt });
    }
    if (u) {
      try {
        this.userSignal.set(JSON.parse(u) as User);
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }
  }

  /** Prefer localStorage so the token is always what was last stored (e.g. right after login). */
  getAccessToken(): string | null {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? this.tokensSignal()?.accessToken ?? null;
    return token && token.trim() ? token : null;
  }

  getRefreshToken(): string | null {
    return this.tokensSignal()?.refreshToken ?? localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  signup(body: SignupRequest): Observable<SignupSuccessResponse> {
    return this.api.post<SignupSuccessResponse>('/auth/signup', body);
  }

  signin(body: SigninRequest): Observable<SigninSuccessResponse> {
    return this.api.post<SigninSuccessResponse>('/auth/signin', body);
  }

  verifyOtp(body: VerificationRequest): Observable<SigninSuccessResponse> {
    return this.api.post<SigninSuccessResponse>('/auth/verify', body);
  }

  resendOtp(email: string): Observable<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>('/auth/resend', { email });
  }

  forgetPassword(email: string): Observable<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>('/auth/forget-password', { email });
  }

  changePassword(body: ChangePasswordRequest): Observable<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>('/auth/change-password', body);
  }

  refreshToken(): Observable<{ success: boolean; message: string; tokens: Tokens }> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<{ success: boolean; message: string; tokens: Tokens }>(
      `${environment.apiBaseUrl}/auth/refresh-token`,
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } },
    );
  }

  logout(): Observable<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>('/auth/logout-all', {});
  }

  createEmployee(body: CreateEmployeeRequest): Observable<{ success: boolean; message: string; data?: { user: User } }> {
    return this.api.post<{ success: boolean; message: string; data?: { user: User } }>('/admin/users/create-employee', body);
  }

  /** List customers for autocomplete (Admin/Employee). */
  getCustomerSuggestions(search?: string, limit = 20): Observable<{ success: boolean; data: Array<{ id: number; email: string; firstName: string | null; lastName: string | null }> }> {
    const params: Record<string, string | number> = { limit };
    if (search != null && search.trim() !== '') params['q'] = search.trim();
    return this.api.get<{ success: boolean; data: Array<{ id: number; email: string; firstName: string | null; lastName: string | null }> }>('/auth/customers', params);
  }

  setSession(response: SigninSuccessResponse): void {
    const tokens = response.tokens;
    const user = response.data?.user;
    if (tokens?.accessToken && tokens?.refreshToken) {
      const at = String(tokens.accessToken).trim();
      const rt = String(tokens.refreshToken).trim();
      if (at && rt) {
        localStorage.setItem(ACCESS_TOKEN_KEY, at);
        localStorage.setItem(REFRESH_TOKEN_KEY, rt);
        this.tokensSignal.set({ accessToken: at, refreshToken: rt });
      }
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      this.userSignal.set(user);
    }
  }

  clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokensSignal.set(null);
    this.userSignal.set(null);
  }

  hasRole(roles: UserRole[]): boolean {
    const r = this.role();
    return r ? roles.includes(r) : false;
  }

  isAdmin(): boolean {
    return this.hasRole(['ADMIN']);
  }

  isEmployee(): boolean {
    return this.hasRole(['EMPLOYEE']);
  }

  isCustomer(): boolean {
    return this.hasRole(['CUSTOMER']);
  }

  canCreateAccount(): boolean {
    return this.hasRole(['ADMIN', 'EMPLOYEE']);
  }

  canUpdateAccount(): boolean {
    return this.hasRole(['ADMIN', 'EMPLOYEE']);
  }

  canDeleteAccount(): boolean {
    return this.hasRole(['ADMIN', 'EMPLOYEE']);
  }

  canApproveLoan(): boolean {
    return this.hasRole(['ADMIN', 'EMPLOYEE']);
  }
}
