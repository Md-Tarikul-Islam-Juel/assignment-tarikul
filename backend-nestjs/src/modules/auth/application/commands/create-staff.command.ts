import type { UserRole } from '../../../../common/types/user-role.type';
import type { CreateAdminDto, CreateEmployeeDto } from '../../interface/dto/auth-request.dto';

export class CreateStaffCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly role: UserRole,
    public readonly firstName?: string,
    public readonly lastName?: string
  ) {}

  static forEmployee(dto: CreateEmployeeDto): CreateStaffCommand {
    return new CreateStaffCommand(dto.email, dto.password, 'EMPLOYEE', dto.firstName, dto.lastName);
  }

  static forAdmin(dto: CreateAdminDto): CreateStaffCommand {
    return new CreateStaffCommand(dto.email, dto.password, 'ADMIN', dto.firstName, dto.lastName);
  }
}
