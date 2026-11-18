import { Body, Controller, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common'
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiServiceUnavailableResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'
import { AuthenticationGuard } from '../authentication/authentication.guard'
import { CurrentPrincipal } from '../authentication/current-principal.decorator'
import type { AuthPrincipal } from '../authentication/authentication.service'
import { PreferencesService } from './preferences.service'
import { AnalysisPreferenceDto, CoveragePreferenceDto, LimitPreferenceDto, PreferencesDto, SavedPreferenceDto, SavePreferenceDto, preferenceTabs } from './preferences.dto'
import { PreferenceAlertsService } from './preference-alerts.service'
import { PreferenceAlertsDto, PreferenceAlertsInputDto } from './preference-alerts.dto'
import { PreferencePeriodDto } from './preference-period'
import { PublicRoute } from '../authentication/public-route.decorator'

@ApiTags('preferences')
@ApiBearerAuth()
@ApiExtraModels(LimitPreferenceDto, CoveragePreferenceDto, AnalysisPreferenceDto, PreferencePeriodDto)
@UseGuards(AuthenticationGuard)
@ApiUnauthorizedResponse({ description: 'JWT/sessão inválida, usuário inativo ou removido' })
@ApiServiceUnavailableResponse({ description: 'PREFERENCES_UNAVAILABLE' })
@Controller('me/preferences')
export class PreferencesController {
  constructor(private readonly preferences: PreferencesService, private readonly alerts: PreferenceAlertsService) {}
  @Get('alerts')
  @ApiOperation({ summary: 'Avaliar avisos pessoais nos períodos salvos; sem alterar resultados ou estado operacional' })
  @ApiOkResponse({ type: PreferenceAlertsDto })
  findAlerts(@CurrentPrincipal() principal: AuthPrincipal) { return this.alerts.find(principal) }

  @Post('alerts/preview')
  @HttpCode(200)
  @PublicRoute()
  @ApiOperation({ summary: 'Prévia pública sem gravação com dados ambientais públicos e limites enviados; intervalo [from,to), UTC', security: [] })
  @ApiOkResponse({ type: PreferenceAlertsDto })
  @ApiBadRequestResponse({ description: 'INVALID_PREFERENCE ou INVALID_PREFERENCE_PERIOD' })
  previewAlerts(@Body() body: PreferenceAlertsInputDto) { return this.alerts.evaluate(body) }
  @Get()
  @ApiOperation({ summary: 'Consultar somente as próprias preferências; todos os papéis autenticados' })
  @ApiOkResponse({ type: PreferencesDto })
  find(@CurrentPrincipal() principal: AuthPrincipal) { return this.preferences.find(principal) }

  @Put(':tab')
  @ApiOperation({ summary: 'Salvar uma aba das próprias preferências; não altera configuração ou resultados ambientais' })
  @ApiParam({ name: 'tab', enum: preferenceTabs })
  @ApiOkResponse({ type: SavedPreferenceDto })
  @ApiBadRequestResponse({ description: 'INVALID_PREFERENCE' })
  @ApiConflictResponse({ description: 'PREFERENCE_CONFLICT; atualizar a revisão antes de reenviar' })
  save(@CurrentPrincipal() principal: AuthPrincipal, @Param('tab') tab: string, @Body() body: SavePreferenceDto) {
    return this.preferences.save(principal, tab, body)
  }
}
