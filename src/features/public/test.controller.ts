import { Controller, Delete, HttpCode } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from '../blogs/domain/blog.entity';
import { Model } from 'mongoose';
import { Post, PostDocument } from '../posts/domain/post.entity';
import { CommentDocument, Comment } from '../comments/domain/comment.entity';
import { HTTP_STATUSES } from '../../utils';
import { Like, LikeDocument } from '../likes/domain/like.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('testing')
export class TestController {
  constructor(
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}

  @Delete('all-data')
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async deleteAll() {
    await this.blogModel.deleteMany({});
    await this.postModel.deleteMany({});
    await this.commentModel.deleteMany({});
    await this.dataSource.query(`DELETE FROM public."Devices"`);
    await this.likeModel.deleteMany({});
    await this.dataSource.query(`DELETE FROM public."Users"`);
    return;
  }
}
