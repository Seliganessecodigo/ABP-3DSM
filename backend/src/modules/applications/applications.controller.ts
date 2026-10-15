import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common'
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
import { CollectionEvidenceService } from './collection-evidence.service'
import { CollectionEvidenceDto } from './collection.dto'

@ApiTags('applications')
@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly applications: ApplicationsService,
    private readonly evidence: CollectionEvidenceService,
  ) {}

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

  @Get(':id/collections/latest')
  @ApiOperation({ summary: 'Consultar a observação válida mais recente' })
  @ApiParam({ name: 'id', schema: { type: 'string', minLength: 1 } })
  @ApiOkResponse({ type: CollectionEvidenceDto })
  @ApiNotFoundResponse({
    description: 'Aplicação ou observação não encontrada',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        code: {
          type: 'string',
          enum: ['APPLICATION_NOT_FOUND', 'COLLECTION_NOT_FOUND'],
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'ID inválido' })
  @ApiServiceUnavailableResponse({
    description: 'Evidências indisponíveis',
    schema: {
      example: {
        statusCode: 503,
        code: 'APPLICATION_EVIDENCE_UNAVAILABLE',
      },
    },
  })
  getLatestEvidence(@Param('id') id: string) {
    if (!id.trim()) {
      throw new BadRequestException({
        code: 'INVALID_APPLICATION_ID',
        message: 'ID de aplicação inválido',
      })
    }
    return this.evidence.getLatest(id)
  }

  @Get(':id/collections/:collectionId')
  @ApiOperation({ summary: 'Consultar observação armazenada pelo ID' })
  @ApiParam({ name: 'id', schema: { type: 'string', minLength: 1 } })
  @ApiParam({
    name: 'collectionId',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiOkResponse({ type: CollectionEvidenceDto })
  @ApiNotFoundResponse({
    description: 'Aplicação ou observação não encontrada',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        code: {
          type: 'string',
          enum: ['APPLICATION_NOT_FOUND', 'COLLECTION_NOT_FOUND'],
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'ID inválido' })
  @ApiServiceUnavailableResponse({
    description: 'Evidências indisponíveis',
    schema: {
      example: {
        statusCode: 503,
        code: 'APPLICATION_EVIDENCE_UNAVAILABLE',
      },
    },
  })
  getEvidenceById(
    @Param('id') id: string,
    @Param('collectionId', new ParseUUIDPipe()) collectionId: string,
  ) {
    if (!id.trim()) {
      throw new BadRequestException({
        code: 'INVALID_APPLICATION_ID',
        message: 'ID de aplicação inválido',
      })
    }
    return this.evidence.getById(id, collectionId)
  }
}
