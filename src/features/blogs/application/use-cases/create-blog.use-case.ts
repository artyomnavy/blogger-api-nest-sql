import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { CreateAndUpdateBlogModel } from '../../api/models/blog.input.model';
import {
  Blog,
  BlogBanInfoByAdmin,
  BlogOutputModel,
} from '../../api/models/blog.output.model';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { Notice } from '../../../../common/notification/notice';
import { HTTP_STATUSES } from '../../../../common/utils';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';
import { BlogsBansByAdminRepository } from '../../infrastructure/blogs-bans-by-admin-repository';

export class CreateBlogCommand {
  constructor(
    public readonly createData: CreateAndUpdateBlogModel,
    public readonly userId: string,
  ) {}
}
@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase
  extends TransactionManagerUseCase<CreateBlogCommand, Notice<BlogOutputModel>>
  implements ICommandHandler<CreateBlogCommand>
{
  constructor(
    private readonly blogsRepository: BlogsRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly blogsBansByAdminRepository: BlogsBansByAdminRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }
  async doLogic(
    command: CreateBlogCommand,
    manager: EntityManager,
  ): Promise<Notice<BlogOutputModel>> {
    const notice = new Notice<BlogOutputModel>();

    const { createData, userId } = command;

    // Проверяем существует ли такой пользователь
    const user = await this.usersQueryRepository.getOrmUserById(
      userId,
      manager,
    );

    if (!user) {
      notice.addError(HTTP_STATUSES.NOT_FOUND_404, 'User not found');
      return notice;
    }

    // Создаем информацию о бане блога
    const newBlogBanInfoByAdmin = new BlogBanInfoByAdmin(uuidv4(), false, null);

    const blogBanByAdmin =
      await this.blogsBansByAdminRepository.createBlogBanInfoByAdmin(
        newBlogBanInfoByAdmin,
        manager,
      );

    // Создаем блог с пользователем и информацией о бане
    const newBlog = new Blog(
      uuidv4(),
      createData.name,
      createData.description,
      createData.websiteUrl,
      new Date(),
      false,
    );

    const createdBlog = await this.blogsRepository.createBlog(
      newBlog,
      user,
      blogBanByAdmin,
      manager,
    );

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
