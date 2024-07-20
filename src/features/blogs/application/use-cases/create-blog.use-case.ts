import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { CreateAndUpdateBlogModel } from '../../api/models/blog.input.model';
import { Blog, BlogOutputModel } from '../../api/models/blog.output.model';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { Notice } from '../../../../common/notification/notice';
import { HTTP_STATUSES } from '../../../../common/utils';

export class CreateBlogCommand {
  constructor(
    public readonly createData: CreateAndUpdateBlogModel,
    public readonly userId: string,
  ) {}
}
@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}
  async execute(command: CreateBlogCommand) {
    const notice = new Notice<BlogOutputModel>();

    const { createData, userId } = command;

    const user = await this.usersQueryRepository.getOrmUserById(userId);

    if (!user) {
      notice.addError(HTTP_STATUSES.NOT_FOUND_404, 'User not found');
      return notice;
    }

    const newBlog = new Blog(
      uuidv4(),
      createData.name,
      createData.description,
      createData.websiteUrl,
      new Date(),
      false,
      user,
    );

    const createdBlog = await this.blogsRepository.createBlog(newBlog);

    notice.addData(createdBlog);

    return notice;
  }
}

// CreateBlogUseCase без использвания CommandBus
// Обязательно нужно зарегистрировать useCases в providers модуля AppModule
// и добавить в конструктор контроллера для обращения await this.createBlogUseCase.execute(createModel)
// @Injectable()
// export class CreateBlogUseCase {
//   constructor(private readonly blogsRepository: BlogsRepository) {}
//
//   async execute(createData: CreateAndUpdateBlogModel) {
//     const newBlog = new Blog(
//       new ObjectId(),
//       createData.name,
//       createData.description,
//       createData.websiteUrl,
//       new Date(),
//       false,
//     );
//
//     const createdBlog = await this.blogsRepository.createBlog(newBlog);
//
//     return createdBlog;
//   }
// }
