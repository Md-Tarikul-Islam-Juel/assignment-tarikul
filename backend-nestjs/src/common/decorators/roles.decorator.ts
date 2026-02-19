import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../types/user-role.type';

export const ROLES_KEY = 'roles';

/**
 * Declare which roles are allowed to access a route.
 * Use with RolesGuard (after AccessTokenStrategy so request.user is set).
 *
 * @example
 * @UseGuards(AccessTokenStrategy, RolesGuard)
 * @Roles(UserRole.ADMIN)
 * @Get('admin/users')
 * listUsers() {}
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
