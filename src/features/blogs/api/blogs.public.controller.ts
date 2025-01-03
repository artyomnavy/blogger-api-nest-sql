import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BlogsQueryRepository } from '../infrastructure/blogs.query-repository';
import { PostsQueryRepository } from '../../posts/infrastructure/posts.query-repository';
import { BlogOutputModel } from './models/blog.output.model';
import { PostOutputModel } from '../../posts/api/models/post.output.model';
import {
  PaginatorBaseModel,
  PaginatorBlogModel,
} from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { UuidPipe } from '../../../common/pipes/uuid.pipe';
import { updateBlogImagesS3UrlsForOutput } from '../../files/images/api/models/blog-image.output.model';
import { updatePostImagesS3UrlsForOutput } from '../../files/images/api/models/post-image.output.model';
import { JwtBearerAuthGuard } from '../../../common/guards/jwt-bearer-auth-guard.service';
import { HTTP_STATUSES, ResultCode } from '../../../common/utils';
import { CurrentUserId } from '../../../common/decorators/current-user-id.param.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { resultCodeToHttpException } from '../../../common/exceptions/result-code-to-http-exception';
import { SubscribeUserToBlogCommand } from '../../subscriptions/application/use-cases/subscribe-user-to-blog.use-case';
import { UnsubscribeUserToBlogCommand } from '../../subscriptions/application/use-cases/unsubscribe-user-to-blog.use-case';
import { BuyMembershipPlanModel } from '../../memberships/api/models/membership.input.model';
import { BuyMembershipPlanToBlogSubscriptionCommand } from '../../memberships/application/use-cases/buy-membership-plan-to-blog-subscription.use-case';
import { Request } from 'express';
import { BlogsMembershipsPlansQueryRepository } from '../../memberships/infrastructure/blogs-memberships-plans-query-repository';
import { MembershipPlanOutputModel } from '../../memberships/api/models/membership.output.model';

@Controller('blogs')
export class BlogsPublicController {
  constructor(
    protected blogsQueryRepository: BlogsQueryRepository,
    protected postsQueryRepository: PostsQueryRepository,
    protected blogsMembershipsPlansQueryRepository: BlogsMembershipsPlansQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  async getAllBlogs(
    @Req() req,
    @Query() query: PaginatorBlogModel,
  ): Promise<PaginatorOutputModel<BlogOutputModel>> {
    const userId = req.userId;

    const blogs = await this.blogsQueryRepository.getAllBlogs(query, userId);

    // return {
    //   ...blogs,
    //   items: blogs.items.map((blog) => ({
    //     ...blog,
    //     images: updateBlogImagesFsUrlsForOutput(
    //       req.protocol,
    //       req.get('host'),
    //       blog.images,
    //     ),
    //   })),
    // };

    return {
      ...blogs,
      items: blogs.items.map((blog) => ({
        ...blog,
        images: updateBlogImagesS3UrlsForOutput(blog.images),
      })),
    };
  }
  @Get(':blogId')
  async getBlog(
    @Req() req,
    @Param('blogId', UuidPipe) blogId: string,
  ): Promise<BlogOutputModel> {
    const userId = req.userId;

    const blog = await this.blogsQueryRepository.getBlogById(blogId, userId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    } else {
      // return {
      //   ...blog,
      //   images: updateBlogImagesFsUrlsForOutput(
      //     req.protocol,
      //     req.get('host'),
      //     blog.images,
      //   ),
      // };

      return {
        ...blog,
        images: updateBlogImagesS3UrlsForOutput(blog.images),
      };
    }
  }
  @Get(':blogId/posts')
  async getPostsForBlog(
    @Param('blogId', UuidPipe) blogId: string,
    @Query() query: PaginatorBaseModel,
    @Req() req,
  ): Promise<PaginatorOutputModel<PostOutputModel>> {
    const userId = req.userId;

    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const posts = await this.postsQueryRepository.getPostsBlogForPublic({
      query,
      blogId,
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
  @Post(':blogId/subscription')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async subscribeUserToBlog(
    @CurrentUserId() userId: string,
    @Param('blogId', UuidPipe) blogId: string,
  ) {
    const result = await this.commandBus.execute(
      new SubscribeUserToBlogCommand(userId, blogId),
    );

    if (result.code !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message, result.field);
    }

    return;
  }
  @Delete(':blogId/subscription')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async unsubscribeUserToBlog(
    @CurrentUserId() userId: string,
    @Param('blogId', UuidPipe) blogId: string,
  ) {
    const result = await this.commandBus.execute(
      new UnsubscribeUserToBlogCommand(userId, blogId),
    );

    if (result.code !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message, result.field);
    }

    return;
  }
  @Post(':blogId/membership')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.OK_200)
  async buyMembershipPlanToBlogSubscription(
    @Req() req: Request,
    @CurrentUserId() userId: string,
    @Param('blogId', UuidPipe) blogId: string,
    @Body() buyModel: BuyMembershipPlanModel,
  ): Promise<{ url: string }> {
    const result = await this.commandBus.execute(
      new BuyMembershipPlanToBlogSubscriptionCommand(
        userId,
        blogId,
        buyModel.membershipPlanId,
        buyModel.paymentSystem,
        req,
      ),
    );

    if (result.code !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message, result.field);
    }

    return result.data;
  }
  @Get(':blogId/membership/plans')
  async getMembershipsPlansForBlog(
    @Param('blogId', UuidPipe) blogId: string,
  ): Promise<MembershipPlanOutputModel[]> {
    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const membershipsPlans: MembershipPlanOutputModel[] =
      await this.blogsMembershipsPlansQueryRepository.getMembershipsPlansForBlog(
        blogId,
      );

    return membershipsPlans;
  }
}
