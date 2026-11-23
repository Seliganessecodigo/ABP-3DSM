import { SetMetadata } from '@nestjs/common'
import { UserRole } from '../../database/entities/user.entity'

export const REQUIRED_ROLES = 'required_roles'
export const RequireRoles = (...roles: UserRole[]) =>
  SetMetadata(REQUIRED_ROLES, roles)
