import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common'
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiServiceUnavailableResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'
import { AuthenticationGuard } from '../authentication/authentication.guard'
import { CurrentPrincipal } from '../authentication/current-principal.decorator'
import type { AuthPrincipal } from '../authentication/authentication.service'
import { PreferencesService } from './preferences.service'
import { AnalysisPreferenceDto, CoveragePreferenceDto, LimitPreferenceDto, PreferencesDto, SavedPreferenceDto, SavePreferenceDto, preferenceTabs } from './preferences.dto'

@ApiTags('preferences')
@ApiBearerAuth()
@ApiExtraModels(LimitPreferenceDto, CoveragePreferenceDto, AnalysisPreferenceDto)
@UseGuards(AuthenticationGuard)
@ApiUnauthorizedResponse({ description: 'JWT/sessão inválida, usuário inativo ou removido' })
@ApiServiceUnavailableResponse({ description: 'PREFERENCES_UNAVAILABLE' })
@Controller('me/preferences')
export class PreferencesController {
  constructor(private readonly preferences: PreferencesService) {}
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
