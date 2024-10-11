import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseFilePipeBuilder,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BlogsQueryRepository } from '../infrastructure/blogs.query-repository';
import { PostsQueryRepository } from '../../posts/infrastructure/posts.query-repository';
import { BlogOutputModel } from './models/blog.output.model';
import {
  CreateAndUpdateBlogModel,
  UpdateBlogMembershipModel,
} from './models/blog.input.model';
import { CreateAndUpdatePostModel } from '../../posts/api/models/post.input.model';
import { PostOutputModel } from '../../posts/api/models/post.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { HTTP_STATUSES } from '../../../common/utils';
import { CreateBlogCommand } from '../application/use-cases/create-blog.use-case';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteBlogCommand } from '../application/use-cases/delete-blog.use-case';
import { UpdateBlogCommand } from '../application/use-cases/update-blog.use-case';
import { UpdatePostCommand } from '../../posts/application/use-cases/update-post.use-case';
import { DeletePostCommand } from '../../posts/application/use-cases/delete-post.use-case';
import { UuidPipe } from '../../../common/pipes/uuid.pipe';
import { CreatePostCommand } from '../../posts/application/use-cases/create-post.use-case';
import { JwtBearerAuthGuard } from '../../../common/guards/jwt-bearer-auth-guard.service';
import { CurrentUserId } from '../../../common/decorators/current-user-id.param.decorator';
import { CommentOutputForBloggerModel } from '../../comments/api/models/comment.output.model';
import { CommentsQueryRepository } from '../../comments/infrastructure/comments.query-repository';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageSizeFileValidator } from '../../../common/files-validators/image-size.file-validator';
import {
  BlogImagesOutputModel,
  updateBlogImagesS3UrlsForOutput,
} from '../../files/images/api/models/blog-image.output.model';
import {
  PostMainImagesOutputModel,
  updatePostImagesS3UrlsForOutput,
} from '../../files/images/api/models/post-image.output.model';
import { UploadBlogMainImageToS3Command } from '../../files/images/application/use-cases/s3/upload-blog-main-image-to-s3.use-case';
import { UploadPostMainImageToS3Command } from '../../files/images/application/use-cases/s3/upload-post-main-image-to-s3.use-case';
import { UploadBlogWallpaperToS3Command } from '../../files/images/application/use-cases/s3/upload-blog-wallpaper-to-s3.use-case';
import { UpdateBlogMembershipCommand } from '../../memberships/application/use-cases/update-blog-membership.use-case';

@Controller('blogger/blogs')
export class BlogsBloggerController {
  constructor(
    protected blogsQueryRepository: BlogsQueryRepository,
    protected postsQueryRepository: PostsQueryRepository,
    protected commentsQueryRepository: CommentsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}
  @Get()
  @UseGuards(JwtBearerAuthGuard)
  async getAllBlogs(
    // @Req() req,
    @CurrentUserId() userId: string,
    @Query() query: PaginatorModel,
  ): Promise<PaginatorOutputModel<BlogOutputModel>> {
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
  @Post()
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async createBlog(
    // @Req() req,
    @CurrentUserId() userId: string,
    @Body() createModel: CreateAndUpdateBlogModel,
  ): Promise<BlogOutputModel> {
    const createCommand = new CreateBlogCommand(createModel, userId);

    const notice = await this.commandBus.execute(createCommand);

    if (notice.hasError()) {
      throw new NotFoundException(notice.messages[0]);
    }

    // return {
    //   ...notice.data,
    //   images: updateBlogImagesFsUrlsForOutput(
    //     req.protocol,
    //     req.get('host'),
    //     notice.data.images,
    //   ),
    // };

    return {
      ...notice.data,
      images: updateBlogImagesS3UrlsForOutput(notice.data.images),
    };
  }
  @Put(':blogId')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async updateBlog(
    @CurrentUserId() userId: string,
    @Param('blogId', UuidPipe) blogId: string,
    @Body() updateModel: CreateAndUpdateBlogModel,
  ) {
    const updateCommand = new UpdateBlogCommand(userId, blogId, updateModel);

    const notice = await this.commandBus.execute(updateCommand);

    if (notice.hasError()) {
      if (notice.code === HTTP_STATUSES.NOT_FOUND_404) {
        throw new NotFoundException(notice.messages[0]);
      } else {
        throw new ForbiddenException(notice.messages[0]);
      }
    }

    return;
  }
  @Delete(':blogId')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async deleteBlog(
    @CurrentUserId() userId: string,
    @Param('blogId', UuidPipe) blogId: string,
  ) {
    const deleteCommand = new DeleteBlogCommand(userId, blogId);

    const notice = await this.commandBus.execute(deleteCommand);

    if (notice.hasError()) {
      if (notice.code === HTTP_STATUSES.NOT_FOUND_404) {
        throw new NotFoundException(notice.messages[0]);
      } else if (notice.code === HTTP_STATUSES.FORBIDDEN_403) {
        throw new ForbiddenException(notice.messages[0]);
      } else {
        throw new Error(notice.messages[0]);
      }
    }

    return;
  }
  @Get(':blogId/posts')
  @UseGuards(JwtBearerAuthGuard)
  async getPostsForBlog(
    // @Req() req,
    @Param('blogId', UuidPipe) blogId: string,
    @Query() query: PaginatorModel,
  ): Promise<PaginatorOutputModel<PostOutputModel>> {
    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const posts = await this.postsQueryRepository.getPostsForBlog({
      query,
      blogId,
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
  @Post(':blogId/posts')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async createPostForBlog(
    @Req() req,
    @CurrentUserId() userId: string,
    @Param('blogId', UuidPipe) blogId: string,
    @Body() createModel: CreateAndUpdatePostModel,
  ): Promise<PostOutputModel> {
    const createCommand = new CreatePostCommand(userId, blogId, createModel);

    const notice = await this.commandBus.execute(createCommand);

    if (notice.hasError()) {
      if (notice.code === HTTP_STATUSES.NOT_FOUND_404) {
        throw new NotFoundException(notice.messages[0]);
      } else {
        throw new ForbiddenException(notice.messages[0]);
      }
    }

    // return {
    //   ...notice.data,
    //   images: {
    //     main: updatePostImagesFsUrlsForOutput(
    //       req.protocol,
    //       req.get('host'),
    //       notice.data.images.main,
    //     ).main,
    //   },
    // };

    return {
      ...notice.data,
      images: {
        main: updatePostImagesS3UrlsForOutput(notice.data.images.main).main,
      },
    };
  }
  @Put(':blogId/posts/:postId')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async updatePost(
    @CurrentUserId() userId: string,
    @Param('blogId', UuidPipe) blogId: string,
    @Param('postId', UuidPipe) postId: string,
    @Body() updateModel: CreateAndUpdatePostModel,
  ) {
    const updateCommand = new UpdatePostCommand(
      userId,
      blogId,
      postId,
      updateModel,
    );

    const notice = await this.commandBus.execute(updateCommand);

    if (notice.hasError()) {
      if (notice.code === HTTP_STATUSES.NOT_FOUND_404) {
        throw new NotFoundException(notice.messages[0]);
      } else {
        throw new ForbiddenException(notice.messages[0]);
      }
    }

    return;
  }
  @Delete(':blogId/posts/:postId')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async deletePost(
    @CurrentUserId() userId: string,
    @Param('blogId', UuidPipe) blogId: string,
    @Param('postId', UuidPipe) postId: string,
  ) {
    const deleteCommand = new DeletePostCommand(userId, blogId, postId);

    const notice = await this.commandBus.execute(deleteCommand);

    if (notice.hasError()) {
      if (notice.code === HTTP_STATUSES.NOT_FOUND_404) {
        throw new NotFoundException(notice.messages[0]);
      } else {
        throw new ForbiddenException(notice.messages[0]);
      }
    }

    return;
  }
  @Get('/comments')
  @UseGuards(JwtBearerAuthGuard)
  async getAllCommentsForPosts(
    @CurrentUserId() userId: string,
    @Query() query: PaginatorModel,
  ): Promise<PaginatorOutputModel<CommentOutputForBloggerModel>> {
    const comments =
      await this.commentsQueryRepository.getAllCommentsPostsForBlogger(
        query,
        userId,
      );

    return comments;
  }
  @Post(':blogId/images/wallpaper')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async uploadWallpaperForBlog(
    // @Req() req,
    @CurrentUserId() userId: string,
    @Param('blogId', UuidPipe) blogId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'png|jpeg|jpg',
        })
        .addMaxSizeValidator({
          maxSize: 100000,
        })
        .addValidator(new ImageSizeFileValidator(1028, 312))
        .build(),
    )
    file: Express.Multer.File,
  ): Promise<BlogImagesOutputModel> {
    // const uploadCommand = new UploadBlogWallpaperToFsCommand(
    //   userId,
    //   blogId,
    //   file.originalname,
    //   file.buffer,
    // );

    const uploadCommand = new UploadBlogWallpaperToS3Command(
      userId,
      blogId,
      file.originalname,
      file.mimetype,
      file.buffer,
    );

    const notice = await this.commandBus.execute(uploadCommand);

    if (notice.hasError()) {
      if (notice.code === HTTP_STATUSES.NOT_FOUND_404) {
        throw new NotFoundException(notice.messages[0]);
      } else {
        throw new ForbiddenException(notice.messages[0]);
      }
    }

    const blogImages = await this.blogsQueryRepository.getBlogImages(blogId);

    if (!blogImages) {
      throw new NotFoundException('Blog images not found');
    }

    // return updateBlogImagesFsUrlsForOutput(
    //   req.protocol,
    //   req.get('host'),
    //   blogImages,
    // );

    return updateBlogImagesS3UrlsForOutput(blogImages);
  }
  @Post(':blogId/images/main')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async uploadMainImageForBlog(
    // @Req() req,
    @CurrentUserId() userId: string,
    @Param('blogId', UuidPipe) blogId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'png|jpeg|jpg',
        })
        .addMaxSizeValidator({
          maxSize: 100000,
        })
        .addValidator(new ImageSizeFileValidator(156, 156))
        .build(),
    )
    file: Express.Multer.File,
  ): Promise<BlogImagesOutputModel> {
    // const uploadCommand = new UploadBlogMainImageToFsCommand(
    //   userId,
    //   blogId,
    //   file.originalname,
    //   file.buffer,
    // );

    const uploadCommand = new UploadBlogMainImageToS3Command(
      userId,
      blogId,
      file.originalname,
      file.mimetype,
      file.buffer,
    );

    const notice = await this.commandBus.execute(uploadCommand);

    if (notice.hasError()) {
      if (notice.code === HTTP_STATUSES.NOT_FOUND_404) {
        throw new NotFoundException(notice.messages[0]);
      } else {
        throw new ForbiddenException(notice.messages[0]);
      }
    }

    const blogImages = await this.blogsQueryRepository.getBlogImages(blogId);

    if (!blogImages) {
      throw new NotFoundException('Blog images not found');
    }

    // return updateBlogImagesFsUrlsForOutput(
    //   req.protocol,
    //   req.get('host'),
    //   blogImages,
    // );

    return updateBlogImagesS3UrlsForOutput(blogImages);
  }
  @Post(':blogId/posts/:postId/images/main')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async uploadMainImageForPost(
    // @Req() req,
    @CurrentUserId() userId: string,
    @Param('blogId', UuidPipe) blogId: string,
    @Param('postId', UuidPipe) postId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'png|jpeg|jpg',
        })
        .addMaxSizeValidator({
          maxSize: 100000,
        })
        .addValidator(new ImageSizeFileValidator(940, 432))
        .build(),
    )
    file: Express.Multer.File,
  ): Promise<PostMainImagesOutputModel> {
    // const uploadCommand = new UploadPostMainImageToFsCommand(
    //   userId,
    //   blogId,
    //   postId,
    //   file.originalname,
    //   file.buffer,
    // );

    const uploadCommand = new UploadPostMainImageToS3Command(
      userId,
      blogId,
      postId,
      file.originalname,
      file.mimetype,
      file.buffer,
    );

    const notice = await this.commandBus.execute(uploadCommand);

    if (notice.hasError()) {
      if (notice.code === HTTP_STATUSES.NOT_FOUND_404) {
        throw new NotFoundException(notice.messages[0]);
      } else {
        throw new ForbiddenException(notice.messages[0]);
      }
    }

    // return updatePostImagesFsUrlsForOutput(
    //   req.protocol,
    //   req.get('host'),
    //   notice.data,
    // );

    return updatePostImagesS3UrlsForOutput(notice.data);
  }
  @Put(':blogId/membership')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async updateBlogMembership(
    @CurrentUserId() userId: string,
    @Param('blogId', UuidPipe) blogId: string,
    @Body() updateModel: UpdateBlogMembershipModel,
  ) {
    const updateCommand = new UpdateBlogMembershipCommand(
      userId,
      blogId,
      updateModel.isMembership,
    );

    const notice = await this.commandBus.execute(updateCommand);

    if (notice.hasError()) {
      if (notice.code === HTTP_STATUSES.NOT_FOUND_404) {
        throw new NotFoundException(notice.messages[0]);
      } else {
        throw new ForbiddenException(notice.messages[0]);
      }
    }

    return;
  }
}
