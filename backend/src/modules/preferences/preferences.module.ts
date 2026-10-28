import { Module } from '@nestjs/common'
import { AuthenticationModule } from '../authentication/authentication.module'
import { PreferencesController } from './preferences.controller'
import { PreferencesRepository } from './preferences.repository'
import { PreferencesService } from './preferences.service'

@Module({ imports: [AuthenticationModule], controllers: [PreferencesController], providers: [PreferencesService, PreferencesRepository] })
export class PreferencesModule {}
