import { Controller, Delete, HttpCode } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from '../blogs/domain/blog.entity';
import { Model } from 'mongoose';
import { Post, PostDocument } from '../posts/domain/post.entity';
import { User, UserDocument } from '../superadmin/users/domain/user.entity';
import { CommentDocument, Comment } from '../comments/domain/comment.entity';
import { HTTP_STATUSES } from '../../utils';
import {
  DeviceSession,
  DeviceSessionDocument,
} from './devices/domain/device.entity';
import { Like, LikeDocument } from '../likes/domain/like.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('testing')
export class TestController {
  constructor(
    @InjectModel(Blog.name) private blogModel: Model<BlogDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(DeviceSession.name)
    private deviceSessionModel: Model<DeviceSessionDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}

  @Delete('all-data')
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async deleteAll() {
    await this.blogModel.deleteMany({});
    await this.postModel.deleteMany({});
    await this.commentModel.deleteMany({});
    await this.deviceSessionModel.deleteMany({});
    await this.likeModel.deleteMany({});
    await this.dataSource.query(`DELETE FROM public."Users"`);
    return;
  }
}
