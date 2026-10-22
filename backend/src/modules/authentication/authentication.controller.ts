import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { AuthenticationService, AuthPrincipal } from './authentication.service'
import {
  AcceptAdminInvitationDto,
  AuthenticatedUserDto,
  ConfirmEmailDto,
  LoginDto,
  RefreshSessionDto,
  RequestEmailConfirmationDto,
  SessionResponseDto,
  TotpChallengeDto,
  TotpChallengeResponseDto,
  TotpConfirmDto,
  TotpProvisioningResponseDto,
  TotpReplacementConfirmDto,
  TotpReplacementDto,
  TotpReplacementResponseDto,
  TotpSetupRequestDto,
  TotpSetupRequiredResponseDto,
} from './authentication.dto'
import { AuthenticationGuard } from './authentication.guard'
import { CurrentPrincipal } from './current-principal.decorator'

@ApiTags('authentication')
@ApiExtraModels(SessionResponseDto, TotpChallengeResponseDto, TotpSetupRequiredResponseDto)
@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authentication: AuthenticationService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autenticar usuário e iniciar sessão' })
  @ApiOkResponse({
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/SessionResponseDto' },
        { $ref: '#/components/schemas/TotpChallengeResponseDto' },
        { $ref: '#/components/schemas/TotpSetupRequiredResponseDto' },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas' })
  @ApiTooManyRequestsResponse({ description: 'Desafio TOTP limitado por conta' })
  login(@Body() body: LoginDto) {
    requireStrings(body, ['organization', 'email', 'password'])
    validateEmail(body.email)
    if (body.password.length > 1024) {
      throw new BadRequestException('Senha excede o limite aceito')
    }
    return this.authentication.login(body)
  }

  @Post('totp/setup')
  @HttpCode(200)
  @ApiOperation({ summary: 'Preparar configuração TOTP do Admin inicial' })
  @ApiOkResponse({ type: TotpProvisioningResponseDto })
  beginTotpSetup(@Body() body: TotpSetupRequestDto) {
    requireStrings(body, ['setupToken'])
    validateOpaqueCredential(body.setupToken)
    return this.authentication.beginInitialTotpSetup(body.setupToken)
  }

  @Post('totp/setup/confirm')
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirmar configuração TOTP e iniciar sessão Admin' })
  @ApiOkResponse({ type: SessionResponseDto })
  confirmTotpSetup(@Body() body: TotpConfirmDto) {
    requireStrings(body, ['setupToken', 'code'])
    validateOpaqueCredential(body.setupToken)
    validateTotpCode(body.code)
    return this.authentication.confirmInitialTotpSetup(body.setupToken, body.code)
  }

  @Post('totp/challenge')
  @HttpCode(200)
  @ApiOperation({ summary: 'Validar desafio TOTP de login' })
  @ApiOkResponse({ type: SessionResponseDto })
  verifyTotpChallenge(@Body() body: TotpChallengeDto) {
    requireStrings(body, ['challengeToken', 'code'])
    validateOpaqueCredential(body.challengeToken)
    validateTotpCode(body.code)
    return this.authentication.verifyTotpLogin(body.challengeToken, body.code)
  }

  @Post('totp/replacement')
  @HttpCode(200)
  @UseGuards(AuthenticationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Iniciar troca do autenticador com senha e TOTP atual' })
  @ApiOkResponse({ type: TotpReplacementResponseDto })
  beginTotpReplacement(
    @CurrentPrincipal() principal: AuthPrincipal,
    @Body() body: TotpReplacementDto,
  ) {
    requireStrings(body, ['password', 'currentCode'])
    if (body.password.length < 8 || body.password.length > 1024) {
      throw new BadRequestException('Senha fora do limite aceito')
    }
    validateTotpCode(body.currentCode)
    return this.authentication.beginTotpReplacement(
      principal,
      body.password,
      body.currentCode,
    )
  }

  @Post('totp/replacement/confirm')
  @HttpCode(200)
  @UseGuards(AuthenticationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmar troca do autenticador' })
  @ApiOkResponse({ schema: { type: 'object', properties: { message: { type: 'string' } } } })
  confirmTotpReplacement(
    @CurrentPrincipal() principal: AuthPrincipal,
    @Body() body: TotpReplacementConfirmDto,
  ) {
    requireStrings(body, ['confirmationToken', 'code'])
    validateOpaqueCredential(body.confirmationToken)
    validateTotpCode(body.code)
    return this.authentication.confirmTotpReplacement(
      principal,
      body.confirmationToken,
      body.code,
    )
  }

  @Post('sessions/refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotacionar o refresh token da sessão' })
  @ApiOkResponse({ type: SessionResponseDto })
  refresh(@Body() body: RefreshSessionDto) {
    requireStrings(body, ['refreshToken'])
    return this.authentication.refresh(body.refreshToken)
  }

  @Post('sessions/logout')
  @HttpCode(204)
  @UseGuards(AuthenticationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revogar a sessão atual' })
  async logout(@CurrentPrincipal() principal: AuthPrincipal): Promise<void> {
    await this.authentication.logout(principal)
  }

  @Get('me')
  @UseGuards(AuthenticationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar a conta autenticada' })
  @ApiOkResponse({ type: AuthenticatedUserDto })
  me(@CurrentPrincipal() principal: AuthPrincipal) {
    return {
      id: principal.userId,
      organizationId: principal.organizationId,
      name: principal.name,
      email: principal.email,
      role: principal.role,
    }
  }

  @Post('invitations/accept')
  @HttpCode(202)
  @ApiOperation({
    summary: 'Cadastrar o primeiro Admin pelo convite da organização',
  })
  acceptInvitation(@Body() body: AcceptAdminInvitationDto) {
    requireStrings(body, ['token', 'name', 'email'])
    if (
      !body.name.trim() ||
      body.name.length > 160 ||
      body.email.length > 320
    ) {
      throw new BadRequestException('Dados do Admin inválidos')
    }
    validateEmail(body.email)
    return this.authentication.acceptAdminInvitation(body)
  }

  @Post('email/confirm')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Confirmar e-mail e definir senha do Admin inicial',
  })
  acceptEmailConfirmation(@Body() body: ConfirmEmailDto) {
    requireStrings(body, ['token', 'password'])
    return this.authentication.confirmEmail(body)
  }

  @Post('email/confirmation/resend')
  @HttpCode(200)
  @ApiOperation({ summary: 'Solicitar reenvio da confirmação do e-mail' })
  resendEmailConfirmation(@Body() body: RequestEmailConfirmationDto) {
    requireStrings(body, ['organization', 'email'])
    validateEmail(body.email)
    return this.authentication.resendEmailConfirmation(body)
  }
}

function validateEmail(email: string): void {
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestException('E-mail inválido')
  }
}

function validateTotpCode(code: string): void {
  if (!/^\d{6}$/.test(code)) {
    throw new BadRequestException('Código TOTP inválido')
  }
}

function validateOpaqueCredential(token: string): void {
  if (token.length > 256) {
    throw new BadRequestException('Credencial de autenticação inválida')
  }
}

function requireStrings(
  body: unknown,
  keys: string[],
): asserts body is Record<string, string> {
  if (!body || typeof body !== 'object') {
    throw new BadRequestException('Corpo da requisição inválido')
  }
  const value = body as Record<string, unknown>
  if (
    keys.some(
      (key) => typeof value[key] !== 'string' || value[key].length === 0,
    )
  ) {
    throw new BadRequestException('Campos obrigatórios inválidos')
  }
}
