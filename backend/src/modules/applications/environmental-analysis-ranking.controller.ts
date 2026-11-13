import { Controller, Get, Query } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiServiceUnavailableResponse,
  ApiTags,
} from "@nestjs/swagger";
import { PublicRoute } from "../authentication/public-route.decorator";
import { EnvironmentalAnalysisRankingDto } from "./environmental-analysis-ranking.dto";
import { EnvironmentalAnalysisRankingService } from "./environmental-analysis-ranking.service";

@ApiTags("analysis")
@Controller("analysis/ranking")
export class EnvironmentalAnalysisRankingController {
  constructor(private readonly ranking: EnvironmentalAnalysisRankingService) {}

  @PublicRoute()
  @Get()
  @ApiOperation({
    summary: "Consultar ranking ambiental por período e métrica",
  })
  @ApiQuery({ name: "from", required: true, type: String, format: "date-time" })
  @ApiQuery({ name: "to", required: true, type: String, format: "date-time" })
  @ApiQuery({ name: "metric", required: true, enum: ["energy", "emissions"] })
  @ApiQuery({ name: "direction", required: true, enum: ["asc", "desc"] })
  @ApiQuery({
    name: "states",
    required: false,
    enum: ["AVAILABLE", "UNAVAILABLE", "NO_METRICS", "REMOVED"],
    isArray: true,
    style: "form",
    explode: true,
  })
  @ApiQuery({
    name: "regionCodes",
    required: false,
    type: String,
    isArray: true,
    style: "form",
    explode: true,
  })
  @ApiQuery({
    name: "applicationIds",
    required: false,
    type: String,
    isArray: true,
    style: "form",
    explode: true,
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description:
      "Busca por trecho, sem distinção de caixa ou acentos, nos campos de dados expostos.",
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    enum: [
      "applicationId",
      "name",
      "state",
      "stateReason",
      "regionCode",
      "country",
      "region",
      "city",
      "energy",
      "emissions",
      "energyCoverage",
      "emissionsCoverage",
      "rankability",
      "position",
      "participation",
    ],
  })
  @ApiQuery({ name: "sortDirection", required: false, enum: ["asc", "desc"] })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    minimum: 1,
    default: 1,
  })
  @ApiQuery({
    name: "pageSize",
    required: false,
    schema: {
      oneOf: [
        { type: "integer", enum: [5, 10, 15, 20] },
        { type: "string", enum: ["all"] },
      ],
    },
    default: 10,
  })
  @ApiQuery({ name: "filterApplicationId", required: false, type: String })
  @ApiQuery({ name: "filterName", required: false, type: String })
  @ApiQuery({
    name: "filterState",
    required: false,
    enum: ["AVAILABLE", "UNAVAILABLE", "NO_METRICS", "REMOVED"],
  })
  @ApiQuery({ name: "filterStateReason", required: false, type: String })
  @ApiQuery({
    name: "filterEnergyReason",
    required: false,
    type: String,
    description: "Reason code exato presente na medida de energia.",
  })
  @ApiQuery({
    name: "filterEmissionsReason",
    required: false,
    type: String,
    description: "Reason code exato presente na medida de emissões.",
  })
  @ApiQuery({ name: "filterRegionCode", required: false, type: String })
  @ApiQuery({ name: "filterCountry", required: false, type: String })
  @ApiQuery({ name: "filterRegion", required: false, type: String })
  @ApiQuery({ name: "filterCity", required: false, type: String })
  @ApiQuery({
    name: "filterRankability",
    required: false,
    enum: ["ranked", "unranked"],
  })
  @ApiQuery({ name: "energyMin", required: false, type: Number, minimum: 0 })
  @ApiQuery({ name: "energyMax", required: false, type: Number, minimum: 0 })
  @ApiQuery({ name: "energyMissing", required: false, enum: ["true", "false"] })
  @ApiQuery({ name: "emissionsMin", required: false, type: Number, minimum: 0 })
  @ApiQuery({ name: "emissionsMax", required: false, type: Number, minimum: 0 })
  @ApiQuery({
    name: "emissionsMissing",
    required: false,
    enum: ["true", "false"],
  })
  @ApiQuery({
    name: "energyCoverageMin",
    required: false,
    type: Number,
    minimum: 0,
    maximum: 1,
  })
  @ApiQuery({
    name: "energyCoverageMax",
    required: false,
    type: Number,
    minimum: 0,
    maximum: 1,
  })
  @ApiQuery({
    name: "emissionsCoverageMin",
    required: false,
    type: Number,
    minimum: 0,
    maximum: 1,
  })
  @ApiQuery({
    name: "emissionsCoverageMax",
    required: false,
    type: Number,
    minimum: 0,
    maximum: 1,
  })
  @ApiQuery({ name: "positionMin", required: false, type: Number, minimum: 1 })
  @ApiQuery({ name: "positionMax", required: false, type: Number, minimum: 1 })
  @ApiQuery({
    name: "positionMissing",
    required: false,
    enum: ["true", "false"],
  })
  @ApiQuery({
    name: "participationMin",
    required: false,
    type: Number,
    minimum: 0,
    maximum: 1,
  })
  @ApiQuery({
    name: "participationMax",
    required: false,
    type: Number,
    minimum: 0,
    maximum: 1,
  })
  @ApiQuery({
    name: "participationMissing",
    required: false,
    enum: ["true", "false"],
  })
  @ApiOkResponse({ type: EnvironmentalAnalysisRankingDto })
  @ApiBadRequestResponse({
    description: "Período ou parâmetros de busca inválidos",
  })
  @ApiServiceUnavailableResponse({
    description: "Dados ambientais indisponíveis",
  })
  getRanking(
    @Query() query: Record<string, string | string[] | undefined>,
  ): Promise<EnvironmentalAnalysisRankingDto> {
    return this.ranking.getRanking(query);
  }
}
