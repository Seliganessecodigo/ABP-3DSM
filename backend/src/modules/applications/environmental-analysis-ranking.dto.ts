import { ApiProperty } from "@nestjs/swagger";
import {
  EnvironmentalAnalysisCoverageDto,
  EnvironmentalAnalysisMeasureDto,
  EnvironmentalAnalysisPeriodDto,
} from "./environmental-analysis.dto";

export class EnvironmentalAnalysisRankingLocationDto {
  @ApiProperty({ type: String, nullable: true }) regionCode!: string | null;
  @ApiProperty({ type: String, nullable: true }) country!: string | null;
  @ApiProperty({ type: String, nullable: true }) region!: string | null;
  @ApiProperty({ type: String, nullable: true }) city!: string | null;
}

export class EnvironmentalAnalysisRankingItemDto {
  @ApiProperty() applicationId!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: ["AVAILABLE", "UNAVAILABLE", "NO_METRICS", "REMOVED"] })
  state!: string;
  @ApiProperty({ type: String, nullable: true }) stateReason!: string | null;
  @ApiProperty({ type: EnvironmentalAnalysisRankingLocationDto })
  location!: EnvironmentalAnalysisRankingLocationDto;
  @ApiProperty({ type: EnvironmentalAnalysisMeasureDto })
  energy!: EnvironmentalAnalysisMeasureDto;
  @ApiProperty({ type: EnvironmentalAnalysisMeasureDto })
  emissions!: EnvironmentalAnalysisMeasureDto;
  @ApiProperty({ type: EnvironmentalAnalysisCoverageDto })
  coverage!: EnvironmentalAnalysisCoverageDto;
  @ApiProperty({ enum: ["ranked", "unranked"] }) rankability!:
    "ranked" | "unranked";
  @ApiProperty({ type: Number, nullable: true }) position!: number | null;
  @ApiProperty({ type: Number, nullable: true, minimum: 0, maximum: 1 })
  participation!: number | null;
}

export class EnvironmentalAnalysisRankingScopeDto {
  @ApiProperty({ minimum: 0 }) applicationCount!: number;
  @ApiProperty({ minimum: 0 }) rankedCount!: number;
  @ApiProperty({ minimum: 0 }) unrankedCount!: number;
  @ApiProperty({ type: EnvironmentalAnalysisMeasureDto })
  energy!: EnvironmentalAnalysisMeasureDto;
  @ApiProperty({ type: EnvironmentalAnalysisMeasureDto })
  emissions!: EnvironmentalAnalysisMeasureDto;
  @ApiProperty({ type: EnvironmentalAnalysisCoverageDto })
  coverage!: EnvironmentalAnalysisCoverageDto;
}

export class EnvironmentalAnalysisRankingPresentationDto {
  @ApiProperty({ minimum: 0 }) rankedCount!: number;
  @ApiProperty({ minimum: 0 }) unrankedCount!: number;
}

export class EnvironmentalAnalysisRankingPaginationDto {
  @ApiProperty({ minimum: 1 }) page!: number;
  @ApiProperty({
    oneOf: [{ type: "integer" }, { type: "string", enum: ["all"] }],
  })
  pageSize!: number | "all";
  @ApiProperty({ minimum: 0 }) totalItems!: number;
  @ApiProperty({ minimum: 0 }) totalPages!: number;
}

export class EnvironmentalAnalysisRankingDto {
  @ApiProperty({ enum: ["available", "empty"] }) status!: "available" | "empty";
  @ApiProperty({ enum: ["energy", "emissions"] }) metric!:
    "energy" | "emissions";
  @ApiProperty({ enum: ["asc", "desc"] }) direction!: "asc" | "desc";
  @ApiProperty({ type: EnvironmentalAnalysisPeriodDto })
  period!: EnvironmentalAnalysisPeriodDto;
  @ApiProperty({ type: EnvironmentalAnalysisRankingScopeDto })
  scope!: EnvironmentalAnalysisRankingScopeDto;
  @ApiProperty({ type: EnvironmentalAnalysisRankingPresentationDto })
  presentation!: EnvironmentalAnalysisRankingPresentationDto;
  @ApiProperty({ type: EnvironmentalAnalysisRankingPaginationDto })
  pagination!: EnvironmentalAnalysisRankingPaginationDto;
  @ApiProperty({ type: EnvironmentalAnalysisRankingItemDto, isArray: true })
  items!: readonly EnvironmentalAnalysisRankingItemDto[];
}
