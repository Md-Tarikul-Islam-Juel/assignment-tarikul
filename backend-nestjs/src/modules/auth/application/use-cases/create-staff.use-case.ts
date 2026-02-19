import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailAlreadyExistsError } from '../../domain/errors/email-already-exists.error';
import type { LoggerPort } from '../../domain/repositories/logger.port';
import { LoginSource } from '../../domain/enums/login-source.enum';
import { CreateStaffCommand } from '../commands/create-staff.command';
import { LOGGER_PORT } from '../di-tokens';
import { PasswordPolicyService } from '../services/password-policy.service';
import { UserService } from '../services/user.service';

/**
 * Creates staff (EMPLOYEE or ADMIN) by an admin. Staff do not sign up; they are created with verified account.
 */
@Injectable()
export class CreateStaffUseCase {
  private readonly saltRounds: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject(LOGGER_PORT)
    private readonly logger: LoggerPort,
    private readonly userService: UserService,
    private readonly passwordService: PasswordPolicyService
  ) {
    this.saltRounds = this.configService.get<number>('authConfig.bcryptSaltRounds') ?? 10;
  }

  async execute(command: CreateStaffCommand): Promise<{ id: number; email: string; role: string }> {
    const existing = await this.userService.findUserByEmail(command.email);
    if (existing?.verified) {
      this.logger.error({ message: 'Email already in use for staff creation', email: command.email });
      throw new EmailAlreadyExistsError(command.email);
    }

    const hashedPassword = await this.passwordService.hashPassword(command.password, this.saltRounds);
    const userData = {
      email: command.email,
      firstName: command.firstName ?? '',
      lastName: command.lastName ?? ''
    };

    const user = await this.userService.createUser(
      userData as any,
      hashedPassword,
      LoginSource.DEFAULT,
      true, // Staff are created verified so they can sign in
      command.role
    );

    return { id: user.id, email: user.email, role: user.role };
  }
}
