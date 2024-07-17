import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { BlogsQueryRepository } from '../../infrastructure/blogs.query-repository';
import { HTTP_STATUSES } from '../../../../common/utils';
import { Notice } from '../../../../common/notification/notice';

export class DeleteBlogCommand {
  constructor(
    public readonly userId: string,
    public readonly blogId: string,
  ) {}
}
@CommandHandler(DeleteBlogCommand)
export class DeleteBlogUseCase implements ICommandHandler<DeleteBlogCommand> {
  constructor(
    private blogsRepository: BlogsRepository,
    private blogsQueryRepository: BlogsQueryRepository,
  ) {}
  async execute(command: DeleteBlogCommand) {
    const notice = new Notice();

    const { userId, blogId } = command;

    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      notice.addError('Blog not found', 'blogId', HTTP_STATUSES.NOT_FOUND_404);
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

    const isDeleted = await this.blogsRepository.deleteBlog(command.blogId);

    if (!isDeleted) {
      notice.addError('Blog not deleted', null, null);
    }

    return notice;
  }
}
