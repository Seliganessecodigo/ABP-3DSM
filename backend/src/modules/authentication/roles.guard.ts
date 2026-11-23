import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from '../../database/entities/user.entity'
import { AuthenticatedRequest } from './authentication.guard'
import { REQUIRED_ROLES } from './roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(
      REQUIRED_ROLES,
      [context.getHandler(), context.getClass()],
    )
    if (!required?.length) return true
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    if (
      !request.authPrincipal ||
      !required.includes(request.authPrincipal.role)
    ) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_ROLE',
        message: 'Você não tem permissão para esta operação',
      })
    }
    return true
  }
}
