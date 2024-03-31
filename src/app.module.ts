import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { config } from 'dotenv';
import { BlogsSAController } from './features/blogs/api/blogs.sa.controller';
import { PostsController } from './features/posts/api/posts.public.controller';
import { CommentsController } from './features/comments/api/comments.public.controller';
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
import { LikesCommentsRepository } from './features/likes/infrastructure/likes-comments.repository';
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
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
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
import { LikesPostsRepository } from './features/likes/infrastructure/likes-posts.repository';
import { User } from './features/users/domain/user.entity';
import { Device } from './features/devices/domain/device.entity';

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
  LikesCommentsRepository,
  LikesPostsRepository,
];

const queryRepositoriesProviders = [
  BlogsQueryRepository,
  CommentsQueryRepository,
  UsersQueryRepository,
  PostsQueryRepository,
  DevicesQueryRepository,
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

const options: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'BloggerPlatform',
  // logging: ['query'],
  autoLoadEntities: true,
  synchronize: true,
};

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Device]),
    CqrsModule,
    PassportModule,
    TypeOrmModule.forRoot(options),
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AccessTokenVerificationMiddleware).forRoutes(
      {
        path: '/comments/:commentId',
        method: RequestMethod.GET,
      },
      {
        path: '/posts/:postId/comments',
        method: RequestMethod.GET,
      },
      {
        path: '/posts',
        method: RequestMethod.GET,
      },
      {
        path: '/posts/:postId',
        method: RequestMethod.GET,
      },
      {
        path: '/blogs/:blogId/posts',
        method: RequestMethod.GET,
      },
    );
  }
}
