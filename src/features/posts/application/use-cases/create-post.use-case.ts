import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { CreateAndUpdatePostModel } from '../../api/models/post.input.model';
import { Post, PostOutputModel } from '../../api/models/post.output.model';
import { v4 as uuidv4 } from 'uuid';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/blogs.query-repository';
import { Notice } from '../../../../common/notification/notice';
import { HTTP_STATUSES } from '../../../../common/utils';

export class CreatePostCommand {
  constructor(
    public readonly userId: string,
    public readonly blogId: string,
    public readonly createData: CreateAndUpdatePostModel,
  ) {}
}
@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<CreatePostCommand> {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository,
  ) {}

  async execute(command: CreatePostCommand) {
    const notice = new Notice<PostOutputModel>();

    const { userId, blogId, createData } = command;

    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      notice.addError(HTTP_STATUSES.NOT_FOUND_404, 'Blog not found');
      return notice;
    }

    const isOwnerBlog = await this.blogsQueryRepository.checkOwnerBlog(
      userId,
      blogId,
    );

    if (!isOwnerBlog) {
      notice.addError(HTTP_STATUSES.FORBIDDEN_403, 'Blog not owned by user');
      return notice;
    }

    const newPost = new Post(
      uuidv4(),
      createData.title,
      createData.shortDescription,
      createData.content,
      blogId,
      new Date(),
    );

    const createdPost = await this.postsRepository.createPost(
      newPost,
      blog.name,
    );

    notice.addData(createdPost);

    return notice;
  }
}
