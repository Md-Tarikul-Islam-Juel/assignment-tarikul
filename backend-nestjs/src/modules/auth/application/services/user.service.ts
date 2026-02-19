import type { UserRole } from '../../../../common/types/user-role.type';
import { Inject, Injectable } from '@nestjs/common';
import { AUTH_MESSAGES } from '../../../../common/constants';
import type { LoggerPort } from '../../domain/repositories/logger.port';
import type { PasswordHasherPort } from '../../domain/repositories/password-hasher.port';
import { USER_REPOSITORY_PORT, LOGGER_PORT, PASSWORD_HASHER_PORT } from '../di-tokens';
import type { ChangePasswordDto, OAuthDto, SignupDto } from '../../interface/dto/auth-request.dto';
import type { AuthenticatedRequest, ExistingUserInterface } from '../types/auth.types';
import { User } from '../../domain/entities/user.entity';
import { LoginSource } from '../../domain/enums/login-source.enum';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { UserNotVerifiedError } from '../../domain/errors/user-not-verified.error';
import type { UserRepositoryPort } from '../../domain/repositories/user.repository.port';
import { CommonAuthService } from './common-auth.service';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';

const failedToChangePassword = AUTH_MESSAGES.FAILED_TO_CHANGE_PASSWORD;
const oldPasswordIsRequired = AUTH_MESSAGES.OLD_PASSWORD_REQUIRED;
const unauthorized = AUTH_MESSAGES.UNAUTHORIZED;

/**
 * User Service
 * Application layer service for user operations
 * Following Clean Architecture: all database queries go through repository
 */
@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    private readonly commonAuthService: CommonAuthService,
    @Inject(LOGGER_PORT)
    private readonly logger: LoggerPort,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasherPort
  ) { }

  /**
   * Convert User domain entity to ExistingUserInterface
   * Following Clean Architecture: infrastructure layer converts domain to application DTOs
   */
  private toExistingUserInterface(user: User): ExistingUserInterface {
    return {
      id: user.id,
      email: user.email.getValue(),
      password: user.getPassword().getHashedValue(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      verified: user.verified,
      isForgetPassword: user.isForgetPassword,
      mfaEnabled: user.mfaEnabled,
      failedOtpAttempts: user.failedOtpAttempts,
      accountLockedUntil: user.accountLockedUntil || undefined
    };
  }

  async findUserByEmail(email: string): Promise<ExistingUserInterface | null> {
    // Following Clean Architecture: all database queries go through repository
    const user = await this.userRepository.findByEmailString(email);
    if (!user) {
      return null;
    }
    return this.toExistingUserInterface(user);
  }

  /**
   * List customers for autocomplete (Admin/Employee). Optional email search.
   */
  async listCustomers(search?: string, limit?: number): Promise<Array<{ id: number; email: string; firstName: string | null; lastName: string | null }>> {
    return this.userRepository.findManyCustomers({ search, limit: limit ?? 20 });
  }

  /**
   * Get email addresses by user IDs. Returns a map of userId -> email.
   */
  async getEmailsByIds(ids: number[]): Promise<Map<number, string>> {
    return this.userRepository.findEmailsByIds(ids);
  }

  /**
   * Create or update user. Public signup must pass role CUSTOMER; admin-created users pass EMPLOYEE or ADMIN.
   */
  async createUser(
    userData: SignupDto | OAuthDto,
    password: string,
    loginSource: LoginSource,
    verified: boolean,
    role: UserRole = 'CUSTOMER'
  ): Promise<ExistingUserInterface> {
    const existingUser = await this.userRepository.findByEmailString(userData.email);

    if (existingUser) {
      const updatedUser = new User(
        existingUser.id,
        existingUser.email,
        existingUser.getPassword(),
        userData.firstName ?? existingUser.firstName,
        userData.lastName ?? existingUser.lastName,
        existingUser.role, // Keep existing role on update
        verified,
        existingUser.isForgetPassword,
        loginSource,
        existingUser.authorizerId,
        userData.mfaEnabled ?? existingUser.mfaEnabled,
        existingUser.failedOtpAttempts,
        existingUser.accountLockedUntil,
        existingUser.lastActivityAt,
        existingUser.logoutPin,
        null,
        existingUser.createdAt,
        existingUser.updatedAt
      );
      const savedUser = await this.userRepository.update(updatedUser);
      return this.toExistingUserInterface(savedUser);
    }

    const now = new Date();
    const newUser = new User(
      0,
      Email.create(userData.email),
      Password.create(password),
      userData.firstName ?? null,
      userData.lastName ?? null,
      role,
      verified,
      false,
      loginSource,
      null,
      userData.mfaEnabled ?? false,
      0,
      null,
      null,
      '',
      null,
      now,
      now
    );
    const savedUser = await this.userRepository.save(newUser);
    return this.toExistingUserInterface(savedUser);
  }

  async updateUserVerificationStatus(email: string, verified: boolean): Promise<void> {
    // Following Clean Architecture: all database queries go through repository
    const user = await this.userRepository.findByEmailString(email);
    if (!user) {
      throw new UserNotFoundError();
    }
    await this.userRepository.updateVerificationStatus(user.id, verified);
  }

  async updateForgotPasswordStatus(email: string, isForgetPassword: boolean): Promise<ExistingUserInterface> {
    // Following Clean Architecture: all database queries go through repository
    const user = await this.userRepository.findByEmailString(email);
    if (!user) {
      throw new UserNotFoundError();
    }
    const updatedUser = await this.userRepository.updateForgotPasswordStatus(user.id, isForgetPassword);
    return this.toExistingUserInterface(updatedUser);
  }

  async updateLogoutPin(userId: number, logoutPin: string): Promise<void> {
    // Following Clean Architecture: all database queries go through repository
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    await this.userRepository.updateLogoutPin(userId, logoutPin);
  }

  authenticateUser(user: ExistingUserInterface, password: string): void {
    if (!user) {
      // Context automatically detected from call stack
      this.logger.error(unauthorized, undefined, undefined, user);
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = this.passwordHasher.compareSync(password, user.password);

    if (!isPasswordValid) {
      // Log invalid password attempt with email (automatically masked by logger)
      // Context automatically detected from call stack
      this.logger.error('Authentication failed. Invalid password provided.', undefined, undefined, {
        email: user.email, // Will be automatically masked: "md***@gmail.com"
        userId: user.id,
        loginAttempt: 'invalid_password'
      });
      throw new InvalidCredentialsError();
    }

    if (!user.verified) {
      // Context automatically detected from call stack
      this.logger.error(`Authentication failed. User ${user.email} is not verified.`, undefined, undefined, user);
      throw new UserNotVerifiedError(user.email);
    }
  }

  public verifyUserExist(user: ExistingUserInterface, callback: () => void, message: string): void {
    if (!user) {
      // Context automatically detected from call stack
      this.logger.error(message, undefined, undefined, user);
      callback();
    }
  }

  async verifyUserAndChangePassword(user: ExistingUserInterface, changePasswordData: ChangePasswordDto, req: AuthenticatedRequest): Promise<void> {
    if (!user) {
      this.logger.error({
        message: `${failedToChangePassword} because user not exist`,
        details: user
      });
      throw new UserNotFoundError();
    }

    if (req.user.isForgetPassword === false) {
      if (!changePasswordData.oldPassword) {
        this.logger.error({
          message: `${oldPasswordIsRequired}`,
          details: user
        });
        throw new InvalidCredentialsError();
      }

      const isPasswordValid = this.passwordHasher.compareSync(changePasswordData.oldPassword, user.password);
      if (!isPasswordValid) {
        this.logger.error({
          message: `${failedToChangePassword} because password not matched`,
          details: user
        });
        throw new InvalidCredentialsError();
      }
    }

    if (!user.verified) {
      this.logger.error({
        message: `${failedToChangePassword}`,
        details: user
      });
      throw new UserNotVerifiedError(user.email);
    }
  }
}

