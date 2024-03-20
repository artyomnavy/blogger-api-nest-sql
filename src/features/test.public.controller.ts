import { Controller, Delete, HttpCode } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HTTP_STATUSES } from '../utils';

@Controller('testing')
export class TestController {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  @Delete('all-data')
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async deleteAll() {
    await this.dataSource.query(`DELETE FROM public."Blogs"`);
    await this.dataSource.query(`DELETE FROM public."Posts"`);
    await this.dataSource.query(`DELETE FROM public."Comments"`);
    await this.dataSource.query(`DELETE FROM public."Devices"`);
    await this.dataSource.query(`DELETE FROM public."LikesComments"`);
    await this.dataSource.query(`DELETE FROM public."LikesPosts"`);
    await this.dataSource.query(`DELETE FROM public."Users"`);
    return;
  }
}
