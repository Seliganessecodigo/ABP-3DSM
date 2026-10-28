import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import { AuthenticationService, AuthPrincipal } from './authentication.service'

export interface AuthenticatedRequest extends Request {
  authPrincipal: AuthPrincipal
}

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private readonly authentication: AuthenticationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
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
