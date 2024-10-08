import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../../../users/infrastructure/users.query-repository';
import { Notice } from '../../../../../../common/notification/notice';
import { HTTP_STATUSES } from '../../../../../../common/utils';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionManagerUseCase } from '../../../../../../common/use-cases/transaction.use-case';
import { BlogsQueryRepository } from '../../../../../blogs/infrastructure/blogs.query-repository';
import { FilesStorageAdapter } from '../../../adapters/files-storage-adapter';
import {
  BlogMainImage,
  BlogMainImageOutputModel,
} from '../../../api/models/blog-image.output.model';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { BlogsMainImagesRepository } from '../../../infrastructure/blogs-main-images.repository';
import { join } from 'node:path';

export class UploadBlogMainImageToFsCommand {
  constructor(
    public readonly userId: string,
    public readonly blogId: string,
    public readonly originalName: string,
    public readonly buffer: Buffer,
  ) {}
}
@CommandHandler(UploadBlogMainImageToFsCommand)
export class UploadBlogMainImageToFsUseCase
  extends TransactionManagerUseCase<
    UploadBlogMainImageToFsCommand,
    Notice<BlogMainImageOutputModel>
  >
  implements ICommandHandler<UploadBlogMainImageToFsCommand>
{
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly filesStorageAdapter: FilesStorageAdapter,
    private readonly blogsMainImagesRepository: BlogsMainImagesRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }
  async doLogic(
    command: UploadBlogMainImageToFsCommand,
    manager: EntityManager,
  ): Promise<Notice<BlogMainImageOutputModel>> {
    const notice = new Notice<BlogMainImageOutputModel>();

    const { userId, blogId, originalName, buffer } = command;

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

    const dirPath = join('views', 'blogs', `${blogId}`, 'main');

    // Загружаем иконку блога в файловое хранилище
    const fsUrl = await this.filesStorageAdapter.uploadImage(
      dirPath,
      `${blogId}_${originalName}`,
      buffer,
    );

    // Получаем метаданные о загруженной иконке блога
    const metadata = await sharp(buffer).metadata();

    // Записываем в БД информацию о иконке блога
    const mainImage = new BlogMainImage(
      uuidv4(),
      fsUrl,
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
