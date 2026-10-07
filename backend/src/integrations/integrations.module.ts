import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'
import { CarbonFactorService } from './carbon-factor.service'
import { CarbonIntensityAdapter } from './carbon-intensity.adapter'
import { MetricsAggregatorAdapter } from './metrics-aggregator.adapter'

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: MetricsAggregatorAdapter,
      useFactory: () =>
        new MetricsAggregatorAdapter(
          process.env.METRICS_AGGREGATOR_URL ?? 'https://metrics.unilaunch.org',
        ),
    },
    {
      provide: CarbonIntensityAdapter,
      useFactory: () =>
        new CarbonIntensityAdapter(
          process.env.CARBON_INTENSITY_URL ?? 'https://carbon.unilaunch.org',
        ),
    },
    CarbonFactorService,
  ],
  exports: [
    MetricsAggregatorAdapter,
    CarbonIntensityAdapter,
    CarbonFactorService,
  ],
})
export class IntegrationsModule {}
