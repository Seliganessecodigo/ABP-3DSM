import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ApplicationEntity } from '../../database/entities/application.entity'

@Injectable()
export class ApplicationsRepository {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applications: Repository<ApplicationEntity>,
  ) {}

  findAll() {
    return this.applications.find()
  }

  findById(id: string) {
    return this.applications.findOneBy({ id })
  }
}
