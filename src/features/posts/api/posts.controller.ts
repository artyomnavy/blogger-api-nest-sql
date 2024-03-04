import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from '../application/posts.service';
import { PostsQueryRepository } from '../infrastructure/posts.query-repository';
import { CreateAndUpdatePostModel } from './models/post.input.model';
import { CommentsQueryRepository } from '../../comments/infrastructure/comments.query-repository';
import { PostOutputModel } from './models/post.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { CommentOutputModel } from '../../comments/api/models/comment.output.model';
import { HTTP_STATUSES } from '../../../utils';
import { ObjectIdPipe } from '../../../common/pipes/object-id.pipe';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard';
import { CreateAndUpdateCommentModel } from '../../comments/api/models/comment.input.model';
import { UsersQueryRepository } from '../../superadmin/users/infrastructure/users.query-repository';
import { UpdateLikeModel } from '../../likes/api/models/like.input.model';
import { JwtBearerAuthGuard } from '../../../common/guards/jwt-bearer-auth-guard.service';
import { CurrentUserId } from '../../../common/decorators/current-user-id.param.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { DeletePostCommand } from '../application/use-cases/delete-post.use-case';
import { UpdatePostCommand } from '../application/use-cases/update-post.use-case';
import { ChangeLikeStatusForPostCommand } from '../application/use-cases/change-like-status-for-post-use.case';
import { CreateCommentCommand } from '../../comments/application/use-cases/create-comment.use-case';
import { Request } from 'express';

@Controller('posts')
export class PostsController {
  constructor(
    protected postsService: PostsService,
    protected postsQueryRepository: PostsQueryRepository,
    protected commentsQueryRepository: CommentsQueryRepository,
    protected usersQueryRepository: UsersQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}
  @Get(':id/comments')
  async getCommentsForPost(
    @Param('id', ObjectIdPipe) postId: string,
    @Query() query: PaginatorModel,
    @Req() req: Request,
  ): Promise<PaginatorOutputModel<CommentOutputModel>> {
    const userId = req.userId;

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
  @Get()
  async getAllPosts(
    @Query() query: PaginatorModel,
    @Req() req: Request,
  ): Promise<PaginatorOutputModel<PostOutputModel>> {
    const userId = req.userId;

    const posts = await this.postsQueryRepository.getAllPosts({
      query,
      userId,
    });

    return posts;
  }
  @Post()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async createPost(
    @Body() createModel: CreateAndUpdatePostModel,
  ): Promise<PostOutputModel> {
    const newPost = await this.postsService.createPost(createModel);

    return newPost;
  }
  @Post(':id/comments')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async createCommentForPost(
    @Param('id', ObjectIdPipe) postId: string,
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
  @Put(':id/like-status')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async changeLikeStatusForPost(
    @Param('id', ObjectIdPipe) postId: string,
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
  @Get(':id')
  async getPost(
    @Param('id', ObjectIdPipe) postId: string,
    @Req() req: Request,
  ): Promise<PostOutputModel> {
    const userId = req.userId;

    const post = await this.postsQueryRepository.getPostById(postId, userId);

    if (!post) {
      throw new NotFoundException('Post not found');
    } else {
      return post;
    }
  }
  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async updatePost(
    @Param('id', ObjectIdPipe) postId: string,
    @Body() updateModel: CreateAndUpdatePostModel,
  ) {
    const post = await this.postsQueryRepository.getPostById(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const isUpdated = await this.commandBus.execute(
      new UpdatePostCommand(postId, updateModel),
    );

    if (isUpdated) {
      return;
    }
  }
  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async deletePost(@Param('id', ObjectIdPipe) postId: string) {
    const isDeleted = await this.commandBus.execute(
      new DeletePostCommand(postId),
    );

    if (isDeleted) {
      return;
    } else {
      throw new NotFoundException('Post not found');
    }
  }
}
