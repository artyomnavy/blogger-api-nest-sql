import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../../users/infrastructure/users.query-repository';
import { Notice } from '../../../../../common/notification/notice';
import { HTTP_STATUSES } from '../../../../../common/utils';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionManagerUseCase } from '../../../../../common/use-cases/transaction.use-case';
import { BlogsQueryRepository } from '../../../../blogs/infrastructure/blogs.query-repository';
import { FilesStorageAdapter } from '../../../adapters/files-storage-adapter';
import {
  BlogWallpaper,
  BlogWallpaperOutputModel,
} from '../../../api/models/blog-image.output.model';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { BlogsWallpapersRepository } from '../../../infrastructure/blogs-wallpapers.repository';
import { join } from 'node:path';

export class UploadBlogWallpaperToFsCommand {
  constructor(
    public readonly userId: string,
    public readonly blogId: string,
    public readonly originalName: string,
    public readonly buffer: Buffer,
  ) {}
}
@CommandHandler(UploadBlogWallpaperToFsCommand)
export class UploadBlogWallpaperToFsUseCase
  extends TransactionManagerUseCase<
    UploadBlogWallpaperToFsCommand,
    Notice<BlogWallpaperOutputModel>
  >
  implements ICommandHandler<UploadBlogWallpaperToFsCommand>
{
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly filesStorageAdapter: FilesStorageAdapter,
    private readonly blogsWallpapersRepository: BlogsWallpapersRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }
  async doLogic(
    command: UploadBlogWallpaperToFsCommand,
    manager: EntityManager,
  ): Promise<Notice<BlogWallpaperOutputModel>> {
    const notice = new Notice<BlogWallpaperOutputModel>();

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

    // Проверяем существуют ли уже обои блога
    const existingBlogWallpaper =
      await this.blogsQueryRepository.getBlogWallpaperFsUrl(blogId);

    // Если обои блога уже есть, то удаляем в файловом хранилище и в БД
    if (existingBlogWallpaper) {
      await this.filesStorageAdapter.deleteImage(existingBlogWallpaper.url);

      await this.blogsWallpapersRepository.deleteBlogWallpaper(
        existingBlogWallpaper.id,
      );
    }

    const dirPath = join('views', 'blogs', `${blogId}`, 'wallpapers');

    // Загружаем обои блога в файловое хранилище
    const fsUrl = await this.filesStorageAdapter.uploadImage(
      dirPath,
      `${blogId}_${originalName}`,
      buffer,
    );

    // Получаем метаданные о загруженных обоях блога
    const metadata = await sharp(buffer).metadata();

    // Записываем в БД информацию об обоях блога
    const wallpaper = new BlogWallpaper(
      uuidv4(),
      fsUrl,
      metadata.width ?? 0,
      metadata.height ?? 0,
      metadata.size ?? 0,
    );

    const blogWallpaper =
      await this.blogsWallpapersRepository.uploadBlogWallpaper(
        {
          ...wallpaper,
          blog: blog,
        },
        manager,
      );

    notice.addData(blogWallpaper);

    return notice;
  }
}
