import { Controller, Delete, HttpCode } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { HTTP_STATUSES } from '../utils';
import { User } from './users/domain/user.entity';
import { Device } from './devices/domain/device.entity';
import { Blog } from './blogs/domain/blog.entity';
import { Post } from './posts/domain/post.entity';
import { LikePost } from './likes/domain/like-post.entity';
import { Comment } from './comments/domain/comment.entity';
import { LikeComment } from './likes/domain/like-comment.entity';

@Controller('testing')
export class TestController {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Blog)
    private readonly blogsRepository: Repository<Blog>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(LikePost)
    private readonly likesPostsRepository: Repository<LikePost>,
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(LikeComment)
    private readonly likesCommentsRepository: Repository<LikeComment>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Device)
    private readonly devicesRepository: Repository<Device>,
  ) {}

  @Delete('all-data')
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async deleteAll() {
    await this.blogsRepository
      .createQueryBuilder()
      .delete()
      .from(Blog)
      .execute();
    await this.postsRepository
      .createQueryBuilder()
      .delete()
      .from(Post)
      .execute();
    await this.likesPostsRepository
      .createQueryBuilder()
      .delete()
      .from(LikePost)
      .execute();
    await this.commentsRepository
      .createQueryBuilder()
      .delete()
      .from(Comment)
      .execute();
    await this.likesCommentsRepository
      .createQueryBuilder()
      .delete()
      .from(LikeComment)
      .execute();
    await this.devicesRepository
      .createQueryBuilder()
      .delete()
      .from(Device)
      .execute();
    await this.usersRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .execute();
    return;
  }
}
