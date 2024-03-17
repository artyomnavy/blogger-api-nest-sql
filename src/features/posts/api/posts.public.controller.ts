import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostsQueryRepository } from '../infrastructure/posts.query-repository';
import { CommentsQueryRepository } from '../../comments/infrastructure/comments.query-repository';
import { PostOutputModel } from './models/post.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { CommentOutputModel } from '../../comments/api/models/comment.output.model';
import { HTTP_STATUSES } from '../../../utils';
import { CreateAndUpdateCommentModel } from '../../comments/api/models/comment.input.model';
import { UsersQueryRepository } from '../../users/infrastructure/users.query-repository';
import { UpdateLikeModel } from '../../likes/api/models/like.input.model';
import { JwtBearerAuthGuard } from '../../../common/guards/jwt-bearer-auth-guard.service';
import { CurrentUserId } from '../../../common/decorators/current-user-id.param.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { ChangeLikeStatusForPostCommand } from '../application/use-cases/change-like-status-for-post-use.case';
import { CreateCommentCommand } from '../../comments/application/use-cases/create-comment.use-case';
import { UuidPipe } from '../../../common/pipes/uuid.pipe';

@Controller('posts')
export class PostsController {
  constructor(
    protected postsQueryRepository: PostsQueryRepository,
    protected commentsQueryRepository: CommentsQueryRepository,
    protected usersQueryRepository: UsersQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}
  @Get()
  async getAllPosts(
    @Query() query: PaginatorModel,
  ): Promise<PaginatorOutputModel<PostOutputModel>> {
    const posts = await this.postsQueryRepository.getAllPosts({
      query,
    });

    return posts;
  }
  @Get(':postId')
  async getPost(
    @Param('postId', UuidPipe) postId: string,
  ): Promise<PostOutputModel> {
    const post = await this.postsQueryRepository.getPostById(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    } else {
      return post;
    }
  }
  @Get(':postId/comments')
  @UseGuards(JwtBearerAuthGuard)
  async getCommentsForPost(
    @Param('postId', UuidPipe) postId: string,
    @CurrentUserId() userId: string,
    @Query() query: PaginatorModel,
  ): Promise<PaginatorOutputModel<CommentOutputModel>> {
    const post = await this.postsQueryRepository.getPostById(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comments = await this.commentsQueryRepository.getCommentsByPostId({
      query,
      postId,
      userId,
    });

    return comments;
  }
  @Post(':postId/comments')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async createCommentForPost(
    @Param('postId', UuidPipe) postId: string,
    @CurrentUserId() currentUserId: string,
    @Body() createModel: CreateAndUpdateCommentModel,
  ) {
    const post = await this.postsQueryRepository.getPostById(postId);

    if (!post) throw new NotFoundException('Post not found');

    const user = await this.usersQueryRepository.getUserById(currentUserId);

    const userLogin = user!.login;

    const newComment = await this.commandBus.execute(
      new CreateCommentCommand(
        postId,
        currentUserId,
        userLogin,
        createModel.content,
      ),
    );

    return newComment;
  }
  @Put(':postId/like-status')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async changeLikeStatusForPost(
    @Param('id', UuidPipe) postId: string,
    @CurrentUserId() currentUserId: string,
    @Body() updateData: UpdateLikeModel,
  ) {
    const post = await this.postsQueryRepository.getPostById(
      postId,
      currentUserId,
    );

    if (!post) throw new NotFoundException('Post not found');

    const isUpdated = await this.commandBus.execute(
      new ChangeLikeStatusForPostCommand(
        currentUserId,
        post,
        updateData.likeStatus,
      ),
    );

    if (isUpdated) return;
  }
}
