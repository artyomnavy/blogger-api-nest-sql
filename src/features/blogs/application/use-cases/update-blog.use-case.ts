import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { CreateAndUpdateBlogModel } from '../../api/models/blog.input.model';
import { BlogsQueryRepository } from '../../infrastructure/blogs.query-repository';
import { Notice } from '../../../../common/notification/notice';
import { HTTP_STATUSES } from '../../../../common/utils';

export class UpdateBlogCommand {
  constructor(
    public readonly userId: string,
    public readonly blogId: string,
    public readonly updateData: CreateAndUpdateBlogModel,
  ) {}
}
@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase implements ICommandHandler<UpdateBlogCommand> {
  constructor(
    private blogsRepository: BlogsRepository,
    private blogsQueryRepository: BlogsQueryRepository,
  ) {}
  async execute(command: UpdateBlogCommand) {
    const notice = new Notice();

    const { userId, blogId, updateData } = command;

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

    const isUpdated = await this.blogsRepository.updateBlog(blogId, updateData);

    if (!isUpdated) {
      notice.addError('Blog not updated', null, null);
    }

    return notice;
  }
}
