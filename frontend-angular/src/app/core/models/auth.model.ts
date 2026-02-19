export type UserRole = 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt?: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  mfaEnabled?: boolean;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface VerificationRequest {
  email: string;
  otp: string;
}

export interface ResendRequest {
  email: string;
}

export interface ForgetPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  oldPassword?: string;
  newPassword: string;
}

export interface CreateEmployeeRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface SigninSuccessResponse {
  success: boolean;
  message: string;
  tokens?: Tokens;
  data?: { user: User };
  mfa?: { enabled: boolean; type: string };
}

export interface SignupSuccessResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    otp?: { timeout: number; unit: string };
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  tokens: Tokens;
}
