import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostsQueryRepository } from '../../infrastructure/posts.query-repository';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/blogs.query-repository';
import { Notice } from '../../../../common/notification/notice';
import { HTTP_STATUSES } from '../../../../common/utils';

export class DeletePostCommand {
  constructor(
    public readonly userId: string,
    public readonly blogId: string,
    public readonly postId: string,
  ) {}
}
@CommandHandler(DeletePostCommand)
export class DeletePostUseCase implements ICommandHandler<DeletePostCommand> {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository,
  ) {}

  async execute(command: DeletePostCommand) {
    const notice = new Notice();

    const { userId, blogId, postId } = command;

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

    const isDeleted = await this.postsRepository.deletePost(postId);

    if (!isDeleted) {
      notice.addError('Post not deleted', null, null);
    }

    return notice;
  }
}
