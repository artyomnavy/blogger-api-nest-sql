import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { Notice } from '../../../../common/notification/notice';
import { HTTP_STATUSES } from '../../../../common/utils';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/blogs.query-repository';
import { FilesStorageAdapter } from '../../adapters/files-storage-adapter';
import { BlogWallpaper } from '../../api/models/blog-image.output.model';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

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
    Notice<boolean>
  >
  implements ICommandHandler<UploadBlogWallpaperToFsCommand>
{
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly filesStorageAdapter: FilesStorageAdapter,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }
  async doLogic(
    command: UploadBlogWallpaperToFsCommand,
    manager: EntityManager,
  ): Promise<Notice<boolean>> {
    const notice = new Notice<boolean>();

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

    const fsUrl = await this.filesStorageAdapter.uploadBlogWallpaper(
      blogId,
      originalName,
      buffer,
    );

    const metadata = await sharp(buffer).metadata();

    const blogWallpaper = new BlogWallpaper(
      uuidv4(),
      fsUrl,
      metadata.width ?? 0,
      metadata.height ?? 0,
      metadata.size ?? 0,
    );

    // TO DO: write insert blogWallpaper in repo and fix output data

    notice.addData(true);

    return notice;
  }
}
