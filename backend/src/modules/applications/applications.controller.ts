import { BadRequestException, Controller, Get, Param } from '@nestjs/common'
import {
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger'
import { ApplicationDto } from './application.dto'
import { ApplicationsService } from './applications.service'

@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar aplicações conhecidas pelo GreenER' })
  @ApiOkResponse({ type: ApplicationDto, isArray: true })
  @ApiServiceUnavailableResponse({ description: 'Catálogo indisponível' })
  list() {
    return this.applications.list()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar aplicação conhecida pelo ID' })
  @ApiParam({ name: 'id', schema: { type: 'string', minLength: 1 } })
  @ApiOkResponse({ type: ApplicationDto })
  @ApiNotFoundResponse({ description: 'Aplicação não encontrada' })
  @ApiBadRequestResponse({ description: 'ID inválido' })
  @ApiServiceUnavailableResponse({ description: 'Catálogo indisponível' })
  getById(@Param('id') id: string) {
    if (!id.trim()) {
      throw new BadRequestException({
        code: 'INVALID_APPLICATION_ID',
        message: 'ID de aplicação inválido',
      })
    }
    return this.applications.getById(id)
  }
}
