import { ObjectId } from 'mongodb';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { CreateAndUpdateBlogModel } from '../../api/models/blog.input.model';
import { Blog } from '../../api/models/blog.output.model';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreateBlogCommand {
  constructor(public readonly createData: CreateAndUpdateBlogModel) {}
}
@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(private readonly blogsRepository: BlogsRepository) {}
  async execute(command: CreateBlogCommand) {
    const newBlog = new Blog(
      new ObjectId(),
      command.createData.name,
      command.createData.description,
      command.createData.websiteUrl,
      new Date(),
      false,
    );

    const createdBlog = await this.blogsRepository.createBlog(newBlog);

    return createdBlog;
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
