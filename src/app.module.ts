import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import dotenv from 'dotenv';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogEntity } from './features/blogs/domain/blog.entity';
import { Post, PostEntity } from './features/posts/domain/post.entity';
import {
  Comment,
  CommentEntity,
} from './features/comments/domain/comment.entity';
import {
  User,
  UserEntity,
} from './features/superadmin/users/domain/user.entity';
import { BlogsController } from './features/blogs/api/blogs.controller';
import { PostsController } from './features/posts/api/posts.controller';
import { CommentsController } from './features/comments/api/comments.controller';
import { UsersController } from './features/superadmin/users/api/users.controller';
import { PostsService } from './features/posts/application/posts.service';
import { BlogsQueryRepository } from './features/blogs/infrastructure/blogs.query-repository';
import { CommentsQueryRepository } from './features/comments/infrastructure/comments.query-repository';
import { UsersQueryRepository } from './features/superadmin/users/infrastructure/users.query-repository';
import { PostsQueryRepository } from './features/posts/infrastructure/posts.query-repository';
import { TestController } from './features/public/test.controller';
import { BlogsRepository } from './features/blogs/infrastructure/blogs.repository';
import { PostsRepository } from './features/posts/infrastructure/posts.repository';
import { UsersRepository } from './features/superadmin/users/infrastructure/users.repository';
import { BlogExistConstraint } from './common/decorators/validators/blog-validator.decorator';
import {
  CodeConfirmationConstraint,
  EmailExistAndConfirmedConstraint,
  EmailExistConstraint,
  LoginExistConstraint,
  RecoveryCodeConstraint,
} from './common/decorators/validators/user-validator.decorator';
import {
  DeviceSession,
  DeviceSessionEntity,
} from './features/public/devices/domain/device.entity';
import { DevicesQueryRepository } from './features/public/devices/infrastrucure/devices.query-repository';
import { DevicesRepository } from './features/public/devices/infrastrucure/devices.repository';
import { JwtService } from './application/jwt.service';
import { EmailsAdapter } from './adapters/emails-adapter';
import { EmailsManager } from './managers/emails-manager';
import { CommentsRepository } from './features/comments/infrastructure/comments.repository';
import { LikesRepository } from './features/likes/infrastructure/likes.repository';
import { LikesQueryRepository } from './features/likes/infrastructure/likes.query-repository';
import { Like, LikeEntity } from './features/likes/domain/like.entity';
import { AuthModule } from './modules/auth.module';
import { UsersModule } from './modules/users.module';
import { DevicesController } from './features/public/devices/api/security.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { UpdateBlogUseCase } from './features/blogs/application/use-cases/update-blog.use-case';
import { DeleteBlogUseCase } from './features/blogs/application/use-cases/delete-blog.use-case';
import { CreateBlogUseCase } from './features/blogs/application/use-cases/create-blog.use-case';
import { UpdateCommentUseCase } from './features/comments/application/use-cases/update-comment.use-case';
import { DeleteCommentUseCase } from './features/comments/application/use-cases/delete-comment.use-case';
import { CreateCommentUseCase } from './features/comments/application/use-cases/create-comment.use-case';
import { ChangeLikeStatusForCommentUseCase } from './features/comments/application/use-cases/change-like-status-comment.use-case';
import { UpdateDeviceSessionUseCase } from './features/public/devices/application/use-cases/update-device.use-case';
import { TerminateDeviceSessionByLogoutUseCase } from './features/public/devices/application/use-cases/terminate-device-by-logout.use-case';
import { TerminateDeviceSessionByIdUseCase } from './features/public/devices/application/use-cases/terminate-device-by-id.use-case';
import { TerminateAllOthersDevicesSessionsUseCase } from './features/public/devices/application/use-cases/terminate-all-other-devices.use-case';
import { CreateDeviceSessionUseCase } from './features/public/devices/application/use-cases/create-device.use-case';
import { UpdatePostUseCase } from './features/posts/application/use-cases/update-post.use-case';
import { DeletePostUseCase } from './features/posts/application/use-cases/delete-post.use-case';
import { ChangeLikeStatusForPostUseCase } from './features/posts/application/use-cases/change-like-status-for-post-use.case';
import { DeleteUserUseCase } from './features/superadmin/users/application/use-cases/delete-user.use-case';
import { CreateUserByAdminUseCase } from './features/superadmin/users/application/use-cases/create-user-by-admin.use-case';
import { AccessTokenVerificationMiddleware } from './common/middlewares/access-token-verification.middleware';

dotenv.config();

const mongoURI = process.env.MONGO_URL || 'mongodb://0.0.0.0:27017';

if (!mongoURI) {
  throw new Error(`Url doesn't found`);
}

const blogsUseCases = [UpdateBlogUseCase, DeleteBlogUseCase, CreateBlogUseCase];

const commentsUseCases = [
  UpdateCommentUseCase,
  DeleteCommentUseCase,
  CreateCommentUseCase,
  ChangeLikeStatusForCommentUseCase,
];

const devicesUseCases = [
  UpdateDeviceSessionUseCase,
  TerminateDeviceSessionByLogoutUseCase,
  TerminateDeviceSessionByIdUseCase,
  TerminateAllOthersDevicesSessionsUseCase,
  CreateDeviceSessionUseCase,
];

const postsUseCases = [
  UpdatePostUseCase,
  DeletePostUseCase,
  ChangeLikeStatusForPostUseCase,
];

const usersUseCases = [DeleteUserUseCase, CreateUserByAdminUseCase];

const servicesProviders = [AppService, PostsService, JwtService];

const repositoriesProviders = [
  BlogsRepository,
  PostsRepository,
  UsersRepository,
  DevicesRepository,
  CommentsRepository,
  LikesRepository,
];

const queryRepositoriesProviders = [
  BlogsQueryRepository,
  CommentsQueryRepository,
  UsersQueryRepository,
  PostsQueryRepository,
  DevicesQueryRepository,
  LikesQueryRepository,
];

const emailsProviders = [EmailsManager, EmailsAdapter];

const constraintsProviders = [
  BlogExistConstraint,
  LoginExistConstraint,
  EmailExistConstraint,
  RecoveryCodeConstraint,
  CodeConfirmationConstraint,
  EmailExistAndConfirmedConstraint,
];

@Module({
  imports: [
    CqrsModule,
    AuthModule,
    UsersModule,
    MongooseModule.forRoot(mongoURI, {
      dbName: 'BloggerPlatform',
    }),
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogEntity },
      { name: Post.name, schema: PostEntity },
      { name: Comment.name, schema: CommentEntity },
      { name: User.name, schema: UserEntity },
      { name: DeviceSession.name, schema: DeviceSessionEntity },
      { name: Like.name, schema: LikeEntity },
    ]),
  ],
  controllers: [
    AppController,
    DevicesController,
    BlogsController,
    PostsController,
    CommentsController,
    UsersController,
    TestController,
  ],
  providers: [
    ...blogsUseCases,
    ...commentsUseCases,
    ...postsUseCases,
    ...devicesUseCases,
    ...usersUseCases,
    ...servicesProviders,
    ...repositoriesProviders,
    ...queryRepositoriesProviders,
    ...emailsProviders,
    ...constraintsProviders,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AccessTokenVerificationMiddleware).forRoutes(
      {
        path: '/comments/:id',
        method: RequestMethod.GET,
      },
      {
        path: '/posts/:id/comments',
        method: RequestMethod.GET,
      },
      {
        path: '/posts',
        method: RequestMethod.GET,
      },
      {
        path: '/posts/:id',
        method: RequestMethod.GET,
      },
      {
        path: '/blogs/:id/posts',
        method: RequestMethod.GET,
      },
    );
  }
}
