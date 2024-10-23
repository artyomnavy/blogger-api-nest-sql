import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../../../users/infrastructure/users.query-repository';
import { Notice } from '../../../../../../common/notification/notice';
import {
  HTTP_STATUSES,
  PostMainImageSizes,
} from '../../../../../../common/utils';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionManagerUseCase } from '../../../../../../common/use-cases/transaction.use-case';
import { BlogsQueryRepository } from '../../../../../blogs/infrastructure/blogs.query-repository';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { PostsQueryRepository } from '../../../../../posts/infrastructure/posts.query-repository';
import {
  PostMainImage,
  PostMainImageModel,
} from '../../../api/models/post-image.output.model';
import { PostsMainImagesRepository } from '../../../infrastructure/posts-main-images.repository';
import { S3StorageAdapter } from '../../../adapters/s3-storage-adapter';

export class UploadPostMainImageToS3Command {
  constructor(
    public readonly userId: string,
    public readonly blogId: string,
    public readonly postId: string,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly buffer: Buffer,
  ) {}
}
@CommandHandler(UploadPostMainImageToS3Command)
export class UploadPostMainImageToS3UseCase
  extends TransactionManagerUseCase<
    UploadPostMainImageToS3Command,
    Notice<PostMainImageModel[]>
  >
  implements ICommandHandler<UploadPostMainImageToS3Command>
{
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly s3StorageAdapter: S3StorageAdapter,
    private readonly postsMainImagesRepository: PostsMainImagesRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }
  async doLogic(
    command: UploadPostMainImageToS3Command,
    manager: EntityManager,
  ): Promise<Notice<PostMainImageModel[]>> {
    const notice = new Notice<PostMainImageModel[]>();

    const { userId, blogId, postId, originalName, mimeType, buffer } = command;

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

    const originalSizeKey = `views/posts/${postId}/main/${postId}_${originalName}`;
    const middleSizeKey = `views/posts/${postId}/main/${postId}_middle_${originalName}`;
    const smallSizeKey = `views/posts/${postId}/main/${postId}_small_${originalName}`;

    // Загружаем иконки поста в файловое хранилище
    await this.s3StorageAdapter.uploadImage(originalSizeKey, mimeType, buffer);

    await this.s3StorageAdapter.uploadImage(
      middleSizeKey,
      mimeType,
      middleSizeBuffer,
    );

    await this.s3StorageAdapter.uploadImage(
      smallSizeKey,
      mimeType,
      smallSizeBuffer,
    );

    // Записываем в БД информацию о иконках поста
    const originalMainImage = new PostMainImage(
      uuidv4(),
      originalSizeKey,
      originalMetadata.width ?? 0,
      originalMetadata.height ?? 0,
      originalMetadata.size ?? 0,
      PostMainImageSizes.ORIGINAL,
    );

    const middleMainImage = new PostMainImage(
      uuidv4(),
      middleSizeKey,
      middleMetadata.width ?? 0,
      middleMetadata.height ?? 0,
      middleMetadata.size ?? 0,
      PostMainImageSizes.MIDDLE,
    );

    const smallMainImage = new PostMainImage(
      uuidv4(),
      smallSizeKey,
      smallMetadata.width ?? 0,
      smallMetadata.height ?? 0,
      smallMetadata.size ?? 0,
      PostMainImageSizes.SMALL,
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
