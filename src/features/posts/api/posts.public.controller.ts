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
  Req,
  UseGuards,
} from '@nestjs/common';
import { PostsQueryRepository } from '../infrastructure/posts.query-repository';
import { CommentsQueryRepository } from '../../comments/infrastructure/comments.query-repository';
import { PostOutputModel } from './models/post.output.model';
import { PaginatorBaseModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { CommentOutputModel } from '../../comments/api/models/comment.output.model';
import { HTTP_STATUSES, ResultCode } from '../../../common/utils';
import { CreateAndUpdateCommentModel } from '../../comments/api/models/comment.input.model';
import { UpdateLikeModel } from '../../likes/api/models/like.input.model';
import { JwtBearerAuthGuard } from '../../../common/guards/jwt-bearer-auth-guard.service';
import { CurrentUserId } from '../../../common/decorators/current-user-id.param.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { ChangeLikeStatusForPostCommand } from '../../likes/application/use-cases/change-like-status-for-post-use.case';
import { CreateCommentCommand } from '../../comments/application/use-cases/create-comment.use-case';
import { UuidPipe } from '../../../common/pipes/uuid.pipe';
import { UsersQueryRepository } from '../../users/infrastructure/users.query-repository';
import { resultCodeToHttpException } from '../../../common/exceptions/result-code-to-http-exception';
import { updatePostImagesS3UrlsForOutput } from '../../files/images/api/models/post-image.output.model';

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
    @Query() query: PaginatorBaseModel,
    @Req() req,
  ): Promise<PaginatorOutputModel<PostOutputModel>> {
    const userId = req.userId;

    const posts = await this.postsQueryRepository.getAllPostsForPublic({
      query,
      userId,
    });

    // return {
    //   ...posts,
    //   items: posts.items.map((post) => ({
    //     ...post,
    //     images: {
    //       main: updatePostImagesFsUrlsForOutput(
    //         req.protocol,
    //         req.get('host'),
    //         post.images.main,
    //       ).main,
    //     },
    //   })),
    // };

    return {
      ...posts,
      items: posts.items.map((post) => ({
        ...post,
        images: {
          main: updatePostImagesS3UrlsForOutput(post.images.main).main,
        },
      })),
    };
  }
  @Get(':postId')
  async getPost(
    @Param('postId', UuidPipe) postId: string,
    @Req() req,
  ): Promise<PostOutputModel> {
    const userId = req.userId;

    const post = await this.postsQueryRepository.getPostByIdForPublic(
      postId,
      userId,
    );

    if (!post) {
      throw new NotFoundException('Post not found');
    } else {
      // return {
      //   ...post,
      //   images: {
      //     main: updatePostImagesFsUrlsForOutput(
      //       req.protocol,
      //       req.get('host'),
      //       post.images.main,
      //     ).main,
      //   },

      return {
        ...post,
        images: {
          main: updatePostImagesS3UrlsForOutput(post.images.main).main,
        },
      };
    }
  }
  @Get(':postId/comments')
  async getCommentsForPost(
    @Param('postId', UuidPipe) postId: string,
    @Query() query: PaginatorBaseModel,
    @Req() req,
  ): Promise<PaginatorOutputModel<CommentOutputModel>> {
    const userId = req.userId;

    const post = await this.postsQueryRepository.getPostByIdForPublic(postId);

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
    @CurrentUserId() userId: string,
    @Body() createModel: CreateAndUpdateCommentModel,
  ): Promise<CommentOutputModel> {
    const result = await this.commandBus.execute(
      new CreateCommentCommand(postId, userId, createModel.content),
    );

    if (result.code !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message);
    }

    return result.data;
  }
  @Put(':postId/like-status')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async changeLikeStatusForPost(
    @Param('postId', UuidPipe) postId: string,
    @CurrentUserId() userId: string,
    @Body() updateData: UpdateLikeModel,
  ) {
    const result = await this.commandBus.execute(
      new ChangeLikeStatusForPostCommand(userId, postId, updateData.likeStatus),
    );

    if (result.code !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message);
    }

    return;
  }
}
