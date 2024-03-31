import { Controller, Delete, HttpCode } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { HTTP_STATUSES } from '../utils';
import { User } from './users/domain/user.entity';
import { Device } from './devices/domain/device.entity';

@Controller('testing')
export class TestController {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(User)
    private readonly devicesRepository: Repository<Device>,
  ) {}

  @Delete('all-data')
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async deleteAll() {
    await this.dataSource.query(`DELETE FROM public."Blogs"`);
    await this.dataSource.query(`DELETE FROM public."Posts"`);
    await this.dataSource.query(`DELETE FROM public."Comments"`);
    await this.devicesRepository
      .createQueryBuilder()
      .delete()
      .from(Device)
      .execute();
    await this.dataSource.query(`DELETE FROM public."LikesComments"`);
    await this.dataSource.query(`DELETE FROM public."LikesPosts"`);
    await this.usersRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .execute();
    return;
  }
}
