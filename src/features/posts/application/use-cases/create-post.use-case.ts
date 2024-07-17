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

    if (!createdPost) {
      notice.addError('Post not created', null, null);
    }

    notice.addData(createdPost);

    return notice;
  }
}
