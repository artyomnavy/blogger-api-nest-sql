import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { CreateAndUpdatePostModel } from '../../api/models/post.input.model';
import { Notice } from '../../../../common/notification/notice';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/blogs.query-repository';
import { PostsQueryRepository } from '../../infrastructure/posts.query-repository';
import { HTTP_STATUSES } from '../../../../common/utils';

export class UpdatePostCommand {
  constructor(
    public readonly userId: string,
    public readonly blogId: string,
    public readonly postId: string,
    public readonly updateData: CreateAndUpdatePostModel,
  ) {}
}
@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<UpdatePostCommand> {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository,
  ) {}

  async execute(command: UpdatePostCommand) {
    const notice = new Notice();

    const { userId, blogId, postId, updateData } = command;

    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      notice.addError('Blog not found', 'blogId', HTTP_STATUSES.NOT_FOUND_404);
      return notice;
    }

    const post = await this.postsQueryRepository.getPostById(postId);

    if (!post) {
      notice.addError('Post not found', 'postId', HTTP_STATUSES.NOT_FOUND_404);
      return notice;
    }

    const isOwnerBlog = await this.blogsQueryRepository.checkOwnerBlog(
      userId,
      blogId,
    );

    if (!isOwnerBlog) {
      notice.addError(
        'Blog not owned by user',
        'userId',
        HTTP_STATUSES.FORBIDDEN_403,
      );
      return notice;
    }

    const isUpdated = await this.postsRepository.updatePost(postId, updateData);

    if (isUpdated) return notice;
  }
}
