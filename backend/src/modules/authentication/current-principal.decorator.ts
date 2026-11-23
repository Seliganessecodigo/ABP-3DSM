import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AuthenticatedRequest } from './authentication.guard'

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().authPrincipal,
)
