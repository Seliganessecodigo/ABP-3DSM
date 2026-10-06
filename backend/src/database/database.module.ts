import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { typeOrmOptions } from './typeorm.options'

@Global()
@Module({
  imports: [TypeOrmModule.forRootAsync({ useFactory: typeOrmOptions })],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
