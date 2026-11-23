import { Test } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { PreferencesModule } from './preferences.module'

describe('PreferencesModule dependencies', () => {
  it('resolves authentication and shared audit providers', async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          entities: [],
        }),
        PreferencesModule,
      ],
    })
      .overrideProvider(DataSource)
    .useValue({
      entityMetadatas: [],
      options: { type: 'postgres' },
      isInitialized: false,
      getRepository: jest.fn(() => ({})),
    })
      .compile()

    await module.close()
  })
})
