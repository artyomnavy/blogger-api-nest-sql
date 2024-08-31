import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { Notice } from '../../../../common/notification/notice';
import { HTTP_STATUSES, PostMainImageSize } from '../../../../common/utils';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/blogs.query-repository';
import { FilesStorageAdapter } from '../../adapters/files-storage-adapter';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { PostsQueryRepository } from '../../../posts/infrastructure/posts.query-repository';
import {
  PostMainImage,
  PostMainImageModel,
} from '../../api/models/post-image.output.model';
import { PostsMainImagesRepository } from '../../infrastructure/posts-main-images.repository';

export class UploadPostMainImageToFsCommand {
  constructor(
    public readonly userId: string,
    public readonly blogId: string,
    public readonly postId: string,
    public readonly originalName: string,
    public readonly buffer: Buffer,
  ) {}
}
@CommandHandler(UploadPostMainImageToFsCommand)
export class UploadPostMainImageToFsUseCase
  extends TransactionManagerUseCase<
    UploadPostMainImageToFsCommand,
    Notice<PostMainImageModel[]>
  >
  implements ICommandHandler<UploadPostMainImageToFsCommand>
{
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly filesStorageAdapter: FilesStorageAdapter,
    private readonly postsMainImagesRepository: PostsMainImagesRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }
  async doLogic(
    command: UploadPostMainImageToFsCommand,
    manager: EntityManager,
  ): Promise<Notice<PostMainImageModel[]>> {
    const notice = new Notice<PostMainImageModel[]>();

    const { userId, blogId, postId, originalName, buffer } = command;

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

    // Проверяем существует ли такой пост
    const post = await this.postsQueryRepository.getOrmPostById(postId);

    if (!post) {
      notice.addError(HTTP_STATUSES.NOT_FOUND_404, 'Post not found');
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

    const originalSize = sharp(buffer);

    // Получаем метаданные иконки поста оригинального размера
    const originalMetadata = await originalSize.metadata();

    // Создаем иконку поста среднего размера и получаем обновленный буфер
    const middleSizeBuffer = await originalSize
      .clone()
      .resize(300, 180)
      .toBuffer();

    // Получаем метаданные иконки поста среднего размера
    const middleMetadata = await sharp(middleSizeBuffer).metadata();

    // Создаем иконку поста малого размера и получаем обновленный буфер
    const smallSizeBuffer = await originalSize
      .clone()
      .resize(149, 96)
      .toBuffer();

    // Получаем метаданные иконки поста малого размера
    const smallMetadata = await sharp(smallSizeBuffer).metadata();

    // Загружаем иконки поста в файловое хранилище
    const originalFsUrl = await this.filesStorageAdapter.uploadPostMainImage(
      postId,
      originalName,
      buffer,
    );

    const middleFsUrl = await this.filesStorageAdapter.uploadPostMainImage(
      postId,
      'middle_' + originalName,
      middleSizeBuffer,
    );

    const smallFsUrl = await this.filesStorageAdapter.uploadPostMainImage(
      postId,
      'small_' + originalName,
      smallSizeBuffer,
    );

    // Записываем в БД информацию о иконках поста
    const originalMainImage = new PostMainImage(
      uuidv4(),
      originalFsUrl,
      originalMetadata.width ?? 0,
      originalMetadata.height ?? 0,
      originalMetadata.size ?? 0,
      PostMainImageSize.ORIGINAL,
    );

    const middleMainImage = new PostMainImage(
      uuidv4(),
      middleFsUrl,
      middleMetadata.width ?? 0,
      middleMetadata.height ?? 0,
      middleMetadata.size ?? 0,
      PostMainImageSize.MIDDLE,
    );

    const smallMainImage = new PostMainImage(
      uuidv4(),
      smallFsUrl,
      smallMetadata.width ?? 0,
      smallMetadata.height ?? 0,
      smallMetadata.size ?? 0,
      PostMainImageSize.SMALL,
    );

    const originalPostMainImage =
      await this.postsMainImagesRepository.uploadPostMainImage(
        {
          ...originalMainImage,
          post: post,
        },
        manager,
      );

    const middlePostMainImage =
      await this.postsMainImagesRepository.uploadPostMainImage(
        {
          ...middleMainImage,
          post: post,
        },
        manager,
      );

    const smallPostMainImage =
      await this.postsMainImagesRepository.uploadPostMainImage(
        {
          ...smallMainImage,
          post: post,
        },
        manager,
      );

    notice.addData([
      originalPostMainImage,
      middlePostMainImage,
      smallPostMainImage,
    ]);

    return notice;
  }
}
