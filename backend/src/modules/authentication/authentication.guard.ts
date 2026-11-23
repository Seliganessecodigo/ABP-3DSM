import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import { Reflector } from '@nestjs/core'
import { AuthenticationService, AuthPrincipal } from './authentication.service'
import { PUBLIC_ROUTE } from './public-route.decorator'

export interface AuthenticatedRequest extends Request {
  authPrincipal: AuthPrincipal
}

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly authentication: AuthenticationService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    if (request.authPrincipal) return true
    const authorization = request.headers.authorization
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Autenticação necessária',
      })
    }
    request.authPrincipal = await this.authentication.authenticate(
      authorization.slice('Bearer '.length),
    )
    return true
  }
}
