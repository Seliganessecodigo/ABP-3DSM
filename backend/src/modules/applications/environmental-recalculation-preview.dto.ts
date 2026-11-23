import { ApiProperty } from "@nestjs/swagger";
import { EnvironmentalAnalysisDto } from "./environmental-analysis.dto";

export class EnvironmentalRecalculationPreviewRequestDto {
  @ApiProperty({ type: String, format: "date-time" })
  from!: string;

  @ApiProperty({ type: String, format: "date-time" })
  to!: string;
}

export class EnvironmentalRecalculationPreviewDto {
  @ApiProperty({ enum: ["available", "empty", "partial"] })
  status!: "available" | "empty" | "partial";

  @ApiProperty({ type: EnvironmentalAnalysisDto })
  original!: EnvironmentalAnalysisDto;

  @ApiProperty({ type: EnvironmentalAnalysisDto })
  preview!: EnvironmentalAnalysisDto;

  @ApiProperty({
    type: () => EnvironmentalRecalculationPreviewWarningDto,
    isArray: true,
  })
  warnings!: readonly EnvironmentalRecalculationPreviewWarningDto[];
}

export class EnvironmentalRecalculationPreviewWarningDto {
  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String, nullable: true })
  regionCode!: string | null;
}
