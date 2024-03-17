import { Controller, Delete, HttpCode } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Comment, CommentDocument } from './comments/domain/comment.entity';
import { Like, LikeDocument } from './likes/domain/like.entity';
import { HTTP_STATUSES } from '../utils';

@Controller('testing')
export class TestController {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}

  @Delete('all-data')
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async deleteAll() {
    await this.dataSource.query(`DELETE FROM public."Blogs"`);
    await this.dataSource.query(`DELETE FROM public."Posts"`);
    await this.commentModel.deleteMany({});
    await this.dataSource.query(`DELETE FROM public."Devices"`);
    await this.likeModel.deleteMany({});
    await this.dataSource.query(`DELETE FROM public."Users"`);
    return;
  }
}
