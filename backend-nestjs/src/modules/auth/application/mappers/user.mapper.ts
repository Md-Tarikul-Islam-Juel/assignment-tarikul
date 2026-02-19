import {User} from '../../domain/entities/user.entity';
import type {SignInResponseUserDto, SignupResponseUserDto} from '../../interface/dto/auth-response.dto';

export type UserMapperInput = {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: string;
  createdAt?: Date;
};

export class UserMapper {
  static toSignInResponse(user: User | UserMapperInput): SignInResponseUserDto {
    const email = user instanceof User ? user.email.getValue() : user.email;
    const role = user instanceof User ? user.role : (user.role ?? 'CUSTOMER');

    return {
      id: user.id,
      email,
      firstName: (user.firstName ?? '') || '',
      lastName: (user.lastName ?? '') || '',
      role,
    };
  }

  static toSignupResponse(user: User | UserMapperInput): SignupResponseUserDto {
    const email = user instanceof User ? user.email.getValue() : user.email;
    const role = user instanceof User ? user.role : (user.role ?? 'CUSTOMER');

    return {
      id: user.id,
      email,
      firstName: (user.firstName ?? '') || '',
      lastName: (user.lastName ?? '') || '',
      role,
      createdAt: user.createdAt,
    };
  }
}
