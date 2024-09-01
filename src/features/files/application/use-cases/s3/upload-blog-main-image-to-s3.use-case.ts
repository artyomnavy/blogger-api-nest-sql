import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../../users/infrastructure/users.query-repository';
import { Notice } from '../../../../../common/notification/notice';
import { HTTP_STATUSES } from '../../../../../common/utils';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionManagerUseCase } from '../../../../../common/use-cases/transaction.use-case';
import { BlogsQueryRepository } from '../../../../blogs/infrastructure/blogs.query-repository';
import {
  BlogMainImage,
  BlogMainImageOutputModel,
} from '../../../api/models/blog-image.output.model';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { BlogsMainImagesRepository } from '../../../infrastructure/blogs-main-images.repository';
import { S3StorageAdapter } from '../../../adapters/s3-storage-adapter';

export class UploadBlogMainImageToS3Command {
  constructor(
    public readonly userId: string,
    public readonly blogId: string,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly buffer: Buffer,
  ) {}
}
@CommandHandler(UploadBlogMainImageToS3Command)
export class UploadBlogMainImageToS3UseCase
  extends TransactionManagerUseCase<
    UploadBlogMainImageToS3Command,
    Notice<BlogMainImageOutputModel>
  >
  implements ICommandHandler<UploadBlogMainImageToS3Command>
{
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly s3StorageAdapter: S3StorageAdapter,
    private readonly blogsMainImagesRepository: BlogsMainImagesRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }
  async doLogic(
    command: UploadBlogMainImageToS3Command,
    manager: EntityManager,
  ): Promise<Notice<BlogMainImageOutputModel>> {
    const notice = new Notice<BlogMainImageOutputModel>();

    const { userId, blogId, originalName, mimeType, buffer } = command;

    // Проверяем существует ли такой пользователь
    const user = await this.usersQueryRepository.getOrmUserById(
      userId,
      manager,
    );

    if (!user) {
      notice.addError(HTTP_STATUSES.NOT_FOUND_404, 'User not found');
      return notice;
    }

    // Проверяем существует ли такой блог
    const blog = await this.blogsQueryRepository.getOrmBlogByIdWithBanInfo(
      blogId,
      manager,
    );

    if (!blog) {
      notice.addError(HTTP_STATUSES.NOT_FOUND_404, 'Blog not found');
      return notice;
    }

    // Проверяем принадлежит ли блог пользователю
    const isOwnerBlog = await this.blogsQueryRepository.checkOwnerBlog(
      userId,
      blogId,
      manager,
    );

    if (!isOwnerBlog) {
      notice.addError(HTTP_STATUSES.FORBIDDEN_403, 'Blog not owned by user');
      return notice;
    }

    const key = `views/blogs/${blogId}/main/${blogId}_${originalName}`;

    // Загружаем иконку блога в файловое хранилище
    await this.s3StorageAdapter.uploadImage(key, mimeType, buffer);

    // Получаем метаданные о загруженной иконке блога
    const metadata = await sharp(buffer).metadata();

    // Записываем в БД информацию о иконке блога
    const mainImage = new BlogMainImage(
      uuidv4(),
      key,
      metadata.width ?? 0,
      metadata.height ?? 0,
      metadata.size ?? 0,
    );

    const blogMainImage =
      await this.blogsMainImagesRepository.uploadBlogMainImage(
        {
          ...mainImage,
          blog: blog,
        },
        manager,
      );

    notice.addData(blogMainImage);

    return notice;
  }
}
