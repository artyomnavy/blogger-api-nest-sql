import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { config } from 'dotenv';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogEntity } from './features/blogs/domain/blog.entity';
import { Post, PostEntity } from './features/posts/domain/post.entity';
import {
  Comment,
  CommentEntity,
} from './features/comments/domain/comment.entity';
import { BlogsSAController } from './features/blogs/api/blogs.sa.controller';
import { PostsController } from './features/posts/api/posts.public.controller';
import { CommentsController } from './features/comments/api/comments.controller';
import { UsersController } from './features/users/api/users.sa.controller';
import { BlogsQueryRepository } from './features/blogs/infrastructure/blogs.query-repository';
import { CommentsQueryRepository } from './features/comments/infrastructure/comments.query-repository';
import { UsersQueryRepository } from './features/users/infrastructure/users.query-repository';
import { PostsQueryRepository } from './features/posts/infrastructure/posts.query-repository';
import { BlogsRepository } from './features/blogs/infrastructure/blogs.repository';
import { PostsRepository } from './features/posts/infrastructure/posts.repository';
import { UsersRepository } from './features/users/infrastructure/users.repository';
import {
  CodeConfirmationConstraint,
  EmailExistAndConfirmedConstraint,
  EmailExistConstraint,
  LoginExistConstraint,
  RecoveryCodeConstraint,
} from './common/decorators/validators/user-validator.decorator';
import { DevicesQueryRepository } from './features/devices/infrastrucure/devices.query-repository';
import { DevicesRepository } from './features/devices/infrastrucure/devices.repository';
import { JwtService } from './features/auth/application/jwt.service';
import { EmailsAdapter } from './features/auth/adapters/emails-adapter';
import { EmailsManager } from './features/auth/managers/emails-manager';
import { JwtModule } from '@nestjs/jwt';
import { CommentsRepository } from './features/comments/infrastructure/comments.repository';
import { LikesRepository } from './features/likes/infrastructure/likes.repository';
import { LikesQueryRepository } from './features/likes/infrastructure/likes.query-repository';
import { Like, LikeEntity } from './features/likes/domain/like.entity';
import { DevicesController } from './features/devices/api/security.public.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { UpdateBlogUseCase } from './features/blogs/application/use-cases/update-blog.use-case';
import { DeleteBlogUseCase } from './features/blogs/application/use-cases/delete-blog.use-case';
import { CreateBlogUseCase } from './features/blogs/application/use-cases/create-blog.use-case';
import { UpdateCommentUseCase } from './features/comments/application/use-cases/update-comment.use-case';
import { DeleteCommentUseCase } from './features/comments/application/use-cases/delete-comment.use-case';
import { CreateCommentUseCase } from './features/comments/application/use-cases/create-comment.use-case';
import { ChangeLikeStatusForCommentUseCase } from './features/comments/application/use-cases/change-like-status-comment.use-case';
import { UpdateDeviceSessionUseCase } from './features/devices/application/use-cases/update-device.use-case';
import { TerminateDeviceSessionByLogoutUseCase } from './features/devices/application/use-cases/terminate-device-by-logout.use-case';
import { TerminateDeviceSessionByIdUseCase } from './features/devices/application/use-cases/terminate-device-by-id.use-case';
import { TerminateAllOthersDevicesSessionsUseCase } from './features/devices/application/use-cases/terminate-all-other-devices.use-case';
import { CreateDeviceSessionUseCase } from './features/devices/application/use-cases/create-device.use-case';
import { UpdatePostUseCase } from './features/posts/application/use-cases/update-post.use-case';
import { DeletePostUseCase } from './features/posts/application/use-cases/delete-post.use-case';
import { ChangeLikeStatusForPostUseCase } from './features/posts/application/use-cases/change-like-status-for-post-use.case';
import { DeleteUserUseCase } from './features/users/application/use-cases/delete-user.use-case';
import { CreateUserByAdminUseCase } from './features/users/application/use-cases/create-user-by-admin.use-case';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UpdatePasswordForRecoveryUseCase } from './features/auth/application/use-cases/update-password-for-recovery-user.use-case';
import { SendEmailForPasswordRecoveryUseCase } from './features/auth/application/use-cases/send-email-for-password-recovery-user.use-case';
import { ResendingEmailUseCase } from './features/auth/application/use-cases/re-sending-email-user.use-case';
import { CreateUserByRegistrationUseCase } from './features/auth/application/use-cases/create-user-by-registration.use-case';
import { ConfirmEmailUseCase } from './features/auth/application/use-cases/confirm-email-user.use-case';
import { CheckCredentialsUseCase } from './features/auth/application/use-cases/check-credentials-user.use-case';
import { LocalStrategy } from './features/auth/api/strategies/local.strategy';
import { JwtStrategy } from './features/auth/api/strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { jwtSecret } from './features/auth/api/auth.constants';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './features/auth/api/auth.public.controller';
import { TestController } from './features/test.public.controller';
import { BlogsPublicController } from './features/blogs/api/blogs.public.controller';
import { CreatePostUseCase } from './features/posts/application/use-cases/create-post.use-case';
import { AccessTokenVerificationMiddleware } from './common/middlewares/access-token-verification.middleware';
import { BasicStrategy } from './features/auth/api/strategies/basic.strategy';

config();

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
  CreatePostUseCase,
  UpdatePostUseCase,
  DeletePostUseCase,
  ChangeLikeStatusForPostUseCase,
];

const authUseCases = [
  UpdatePasswordForRecoveryUseCase,
  SendEmailForPasswordRecoveryUseCase,
  ResendingEmailUseCase,
  CreateUserByRegistrationUseCase,
  ConfirmEmailUseCase,
  CheckCredentialsUseCase,
];

const usersUseCases = [DeleteUserUseCase, CreateUserByAdminUseCase];

const servicesProviders = [AppService, JwtService];

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

const strategiesProviders = [LocalStrategy, JwtStrategy, BasicStrategy];

const constraintsProviders = [
  LoginExistConstraint,
  EmailExistConstraint,
  RecoveryCodeConstraint,
  CodeConfirmationConstraint,
  EmailExistAndConfirmedConstraint,
];

@Module({
  imports: [
    CqrsModule,
    PassportModule,
    MongooseModule.forRoot(mongoURI, {
      dbName: 'BloggerPlatform',
    }),
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogEntity },
      { name: Post.name, schema: PostEntity },
      { name: Comment.name, schema: CommentEntity },
      { name: Like.name, schema: LikeEntity },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || '127.0.0.1',
      port: 5432,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'BloggerPlatform',
      autoLoadEntities: false,
      synchronize: false,
    }),
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '10m' },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 5,
      },
    ]),
  ],
  controllers: [
    AppController,
    AuthController,
    DevicesController,
    BlogsSAController,
    BlogsPublicController,
    PostsController,
    CommentsController,
    UsersController,
    TestController,
  ],
  providers: [
    ...authUseCases,
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
    ...strategiesProviders,
  ],
})

// export class AppModule {}
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
      // {
      //   path: '/posts',
      //   method: RequestMethod.GET,
      // },
      // {
      //   path: '/posts/:id',
      //   method: RequestMethod.GET,
      // },
      // {
      //   path: '/blogs/:id/posts',
      //   method: RequestMethod.GET,
      // },
    );
  }
}
