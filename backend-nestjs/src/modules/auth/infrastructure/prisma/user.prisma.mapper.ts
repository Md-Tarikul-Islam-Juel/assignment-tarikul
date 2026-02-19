import {User as PrismaUser} from '@prisma/client';
import {User} from '../../domain/entities/user.entity';
import type {UserRole} from '../../../../common/types/user-role.type';
import {Email} from '../../domain/value-objects/email.vo';
import {Password} from '../../domain/value-objects/password.vo';

export class UserPrismaMapper {
  static toDomain(prismaUser: PrismaUser & {role?: UserRole}): User {
    return new User(
      prismaUser.id,
      Email.create(prismaUser.email),
      Password.create(prismaUser.password),
      prismaUser.firstName,
      prismaUser.lastName,
      (prismaUser as any).role ?? 'CUSTOMER',
      prismaUser.verified,
      prismaUser.isForgetPassword,
      prismaUser.loginSource,
      prismaUser.authorizerId,
      prismaUser.mfaEnabled,
      prismaUser.failedOtpAttempts,
      prismaUser.accountLockedUntil,
      prismaUser.lastActivityAt,
      prismaUser.logoutPin,
      prismaUser.deletedAt,
      prismaUser.createdAt,
      prismaUser.updatedAt
    );
  }

  static toPersistence(domainUser: User): Partial<PrismaUser> & {role?: UserRole} {
    return {
      id: domainUser.id,
      email: domainUser.email.getValue(),
      password: domainUser.getPassword().getHashedValue(),
      firstName: domainUser.firstName,
      lastName: domainUser.lastName,
      role: domainUser.role as any,
      verified: domainUser.verified,
      isForgetPassword: domainUser.isForgetPassword,
      loginSource: domainUser.loginSource,
      authorizerId: domainUser.authorizerId,
      mfaEnabled: domainUser.mfaEnabled,
      failedOtpAttempts: domainUser.failedOtpAttempts,
      accountLockedUntil: domainUser.accountLockedUntil,
      lastActivityAt: domainUser.lastActivityAt,
      logoutPin: domainUser.logoutPin,
      deletedAt: domainUser.deletedAt,
      createdAt: domainUser.createdAt,
      updatedAt: domainUser.updatedAt
    };
  }
}
