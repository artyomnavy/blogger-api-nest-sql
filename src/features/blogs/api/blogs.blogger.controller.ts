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
import { CreateAndUpdateBlogModel } from './models/blog.input.model';
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
import { UploadBlogWallpaperToFsCommand } from '../../files/application/use-cases/upload-blog-wallpaper.use-case';
import {
  BlogImagesOutputModel,
  updateBlogImagesUrlsForOutput,
} from '../../files/api/models/blog-image.output.model';
import { UploadBlogMainImageToFsCommand } from '../../files/application/use-cases/upload-blog-main-image.use-case';
import { UploadPostMainImageToFsCommand } from '../../files/application/use-cases/upload-post-main-image.use-case';
import {
  PostMainImagesOutputModel,
  updatePostImagesUrlsForOutput,
} from '../../files/api/models/post-image.output.model';

// TO DO: add protocol + host for output blog/blogs and post/posts

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
    @CurrentUserId() userId: string,
    @Query() query: PaginatorModel,
  ): Promise<PaginatorOutputModel<BlogOutputModel>> {
    const blogs = await this.blogsQueryRepository.getAllBlogs(query, userId);

    return blogs;
  }
  @Post()
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async createBlog(
    @CurrentUserId() userId: string,
    @Body() createModel: CreateAndUpdateBlogModel,
  ): Promise<BlogOutputModel> {
    const createCommand = new CreateBlogCommand(createModel, userId);

    const notice = await this.commandBus.execute(createCommand);

    if (notice.hasError()) {
      throw new NotFoundException(notice.messages[0]);
    }

    return notice.data;
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

    return posts;
  }
  @Post(':blogId/posts')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async createPostForBlog(
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

    return notice.data;
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
    @Req() req,
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
    const uploadCommand = new UploadBlogWallpaperToFsCommand(
      userId,
      blogId,
      file.originalname,
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

    return updateBlogImagesUrlsForOutput(
      req.protocol,
      req.get('host'),
      blogImages,
    );
  }
  @Post(':blogId/images/main')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async uploadMainImageForBlog(
    @Req() req,
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
    const uploadCommand = new UploadBlogMainImageToFsCommand(
      userId,
      blogId,
      file.originalname,
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

    return updateBlogImagesUrlsForOutput(
      req.protocol,
      req.get('host'),
      blogImages,
    );
  }
  @Post(':blogId/posts/:postId/images/main')
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async uploadMainImageForPost(
    @Req() req,
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
    const uploadCommand = new UploadPostMainImageToFsCommand(
      userId,
      blogId,
      postId,
      file.originalname,
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

    return updatePostImagesUrlsForOutput(
      req.protocol,
      req.get('host'),
      notice.data,
    );
  }
}
