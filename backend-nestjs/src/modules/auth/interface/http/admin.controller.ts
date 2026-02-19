import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { UserRole } from '../../../../common/types/user-role.type';
import { AccessTokenStrategy } from '../../../../common/auth/strategies/access-token.strategy';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { API_VERSIONS } from '../../../../common/http/version.constants';
import { AuthService } from '../../application/services/auth.service';
import { CreateEmployeeDto } from '../dto/auth-request.dto';

@ApiTags('Admin')
@Controller({
  path: 'admin',
  version: [API_VERSIONS.V1, API_VERSIONS.V2],
})
export class AdminController {
  constructor(private readonly authService: AuthService) {}

  @Post('users/create-employee')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AccessTokenStrategy, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Create employee (admin only)',
    description: 'Creates a new bank employee. Staff do not sign up; only admins can create them. **Note:** Only one admin exists (admin@gmail.com). Admins cannot create other admins.',
  })
  @ApiBody({ type: CreateEmployeeDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Employee created' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already in use' })
  async createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.authService.createEmployee(dto);
  }
}
