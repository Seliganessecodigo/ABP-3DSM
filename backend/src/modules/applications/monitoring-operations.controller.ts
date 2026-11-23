import { BadRequestException, Body, Controller, Get, Patch, Query } from '@nestjs/common'
import {
  ApiBadRequestResponse, ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse,
  ApiOperation, ApiTags, ApiUnauthorizedResponse,
  ApiQuery,
} from '@nestjs/swagger'
import { UserRole } from '../../database/entities/user.entity'
import { RequireRoles } from '../authentication/roles.decorator'
import { CurrentPrincipal } from '../authentication/current-principal.decorator'
import { AuthPrincipal } from '../authentication/authentication.service'
import { MonitoringOperationsService } from './monitoring-operations.service'
import {
  MonitoringAuditQueryDto, MonitoringAuditPageDto, MonitoringControlInputDto,
  MonitoringCyclePageDto, MonitoringHealthDto,
  MonitoringControlResultDto,
} from './monitoring-operations.dto'
import { parseMonitoringAuditQuery } from './monitoring-audit.query'

@ApiTags('monitoring operations')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sessão ausente ou inválida' })
@ApiForbiddenResponse({ description: 'Consulta restrita a Admin' })
@Controller('monitoring')
@RequireRoles(UserRole.ADMIN)
export class MonitoringOperationsController {
  constructor(private readonly operations: MonitoringOperationsService) {}

  @Get('health')
  @ApiOperation({ summary: 'Consultar saúde operacional do monitoramento' })
  @ApiOkResponse({ type: MonitoringHealthDto })
  health() {
    return this.operations.health()
  }

  @Get('cycles')
  @ApiOperation({ summary: 'Listar ciclos recentes do monitoramento' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20, maximum: 100 })
  @ApiOkResponse({ type: MonitoringCyclePageDto })
  @ApiBadRequestResponse({ description: 'Página ou limite inválido' })
  cycles(@Query('page') pageValue?: string, @Query('limit') limitValue?: string) {
    const page = parsePositiveInteger(pageValue, 1)
    const limit = parsePositiveInteger(limitValue, 20)
    if (limit > 100 || !Number.isSafeInteger((page - 1) * limit)) throw invalidCyclePagination()
    return this.operations.listCycles(page, limit)
  }

  @Get('audit')
  @ApiOperation({ summary: 'Consultar alterações auditáveis da organização', description: 'Inclui alterações e tentativas relevantes de alteração. Exclui consultas, sessões, logins e desafios preparatórios; o filtro é aplicado antes da contagem e paginação.' })
  @ApiOkResponse({ type: MonitoringAuditPageDto })
  @ApiBadRequestResponse({ description: 'Filtro, ordenação ou paginação inválida' })
  audit(@CurrentPrincipal() principal: AuthPrincipal, @Query() query: MonitoringAuditQueryDto) {
    return this.operations.listAuditFromPrincipal(principal, parseMonitoringAuditQuery(query))
  }

  @Patch('control')
  @ApiOperation({ summary: 'Versionar pausa/retomada dos próximos ciclos de monitoramento', description: 'Estado, revisão e auditoria são confirmados na mesma transação. Ciclos iniciados preservam a versão anterior. Repetir o estado não cria uma revisão.' })
  @ApiOkResponse({ type: MonitoringControlResultDto })
  @ApiBadRequestResponse({ description: 'Estado ou motivo inválido' })
  setControl(@CurrentPrincipal() principal: AuthPrincipal, @Body() body: MonitoringControlInputDto) {
    return this.operations.setPaused(principal, body?.paused, body?.reason)
  }
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) throw invalidCyclePagination()
  return Number(value)
}

function invalidCyclePagination() {
  return new BadRequestException({ code: 'INVALID_MONITORING_CYCLE_PAGINATION', message: 'Página ou limite inválido' })
}
