import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common'
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'
import { AuthPrincipal } from './authentication.service'
import { CurrentPrincipal } from './current-principal.decorator'
import { AccountsService } from './accounts.service'
import { AccountResponseDto, AccountsQueryDto, AccountsResponseDto, ChangeAccountRoleDto, CreateAccountDto, parseAccountsQuery, parseChangeAccountRole, parseCreateAccount } from './accounts.dto'

@ApiTags('accounts')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sessão inválida, conta inativa ou segundo fator pendente' })
@ApiForbiddenResponse({ description: 'Somente Admin ativo da organização; negações são auditadas' })
@ApiBadRequestResponse({ description: 'Campos ou parâmetros inválidos' })
@Controller('auth/users')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  // Global JWT guard authenticates; the service verifies current Admin privileges under the transaction lock and audits denials.
  @Get()
  @ApiOperation({ summary: 'Listar contas da própria organização', description: 'Busca/filtros antes da paginação. Datas ISO UTC, enums por código; campos sensíveis nunca são consultados. Ordenação nativa do PostgreSQL, NULLS LAST e desempate por id. pageSize=all retorna o conjunto completo.' })
  @ApiOkResponse({ type: AccountsResponseDto })
  list(@CurrentPrincipal() principal: AuthPrincipal, @Query() query: AccountsQueryDto) {
    return this.accounts.list(principal, parseAccountsQuery(query))
  }

  @Post()
  @ApiOperation({ summary: 'Criar conta sem acesso antes da confirmação de e-mail', description: 'Não recebe nem devolve senha. A ativação usa os fluxos existentes de reenvio e confirmação de e-mail; o titular define sua senha. Não envia e-mail automaticamente.' })
  @ApiCreatedResponse({ type: AccountResponseDto })
  @ApiConflictResponse({ description: 'E-mail já cadastrado; não revela dados de outra organização' })
  create(@CurrentPrincipal() principal: AuthPrincipal, @Body() body: CreateAccountDto) {
    return this.accounts.create(principal, parseCreateAccount(body))
  }

  @Patch(':userId/role')
  @ApiOperation({ summary: 'Alterar papel e revogar sessões da conta', description: 'Exige papel esperado e motivo. Preserva último Admin ativo e impede autorrebaixamento; mudança e auditoria são atômicas. Papel já alcançado é sucesso idempotente.' })
  @ApiOkResponse({ type: AccountResponseDto })
  @ApiConflictResponse({ description: 'Papel desatualizado ou último Admin ativo' })
  @ApiNotFoundResponse({ description: 'Conta não encontrada na organização' })
  changeRole(@CurrentPrincipal() principal: AuthPrincipal, @Param('userId', new ParseUUIDPipe()) id: string, @Body() body: ChangeAccountRoleDto) {
    return this.accounts.changeRole(principal, id, parseChangeAccountRole(body))
  }
}
