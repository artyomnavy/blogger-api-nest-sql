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
import { UsersSAController } from './features/users/api/users.sa.controller';
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
import { ChangeLikeStatusForCommentUseCase } from './features/likes/application/use-cases/change-like-status-comment.use-case';
import { UpdateDeviceSessionUseCase } from './features/devices/application/use-cases/update-device.use-case';
import { TerminateDeviceSessionByLogoutUseCase } from './features/devices/application/use-cases/terminate-device-by-logout.use-case';
import { TerminateDeviceSessionByIdUseCase } from './features/devices/application/use-cases/terminate-device-by-id.use-case';
import { TerminateAllOthersDevicesSessionsUseCase } from './features/devices/application/use-cases/terminate-all-other-devices.use-case';
import { CreateDeviceSessionUseCase } from './features/devices/application/use-cases/create-device.use-case';
import { UpdatePostUseCase } from './features/posts/application/use-cases/update-post.use-case';
import { DeletePostUseCase } from './features/posts/application/use-cases/delete-post.use-case';
import { ChangeLikeStatusForPostUseCase } from './features/likes/application/use-cases/change-like-status-for-post-use.case';
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
import { Blog } from './features/blogs/domain/blog.entity';
import { Post } from './features/posts/domain/post.entity';
import { Comment } from './features/comments/domain/comment.entity';
import { LikePost } from './features/likes/domain/like-post.entity';
import { LikeComment } from './features/likes/domain/like-comment.entity';
import { CreateQuestionUseCase } from './features/quiz/application/create-question.use-case';
import { DeleteQuestionUseCase } from './features/quiz/application/delete-question.use-case';
import { UpdatePublishQuestionUseCase } from './features/quiz/application/update-publish-question.use-case';
import { UpdateQuestionUseCase } from './features/quiz/application/update-question.use-case';
import { QuestionsRepository } from './features/quiz/infrastructure/questions.repository';
import { QuestionsQueryRepository } from './features/quiz/infrastructure/questions.query-repository';
import { QuizSAController } from './features/quiz/api/quiz.sa.controller';
import { Question } from './features/quiz/domain/question.entity';
import { Answer } from './features/quiz/domain/answer.entity';
import { Quiz } from './features/quiz/domain/quiz.entity';
import { PlayerSession } from './features/quiz/domain/player-session.entity';
import { CreateOrConnectQuizUseCase } from './features/quiz/application/create-or-connect-quiz.use-case';
import { CreateAnswerUseCase } from './features/quiz/application/create-answer.use-case';
import { QuizzesRepository } from './features/quiz/infrastructure/quizzes.repository';
import { PlayersSessionsRepository } from './features/quiz/infrastructure/players-sessions.repository';
import { AnswersRepository } from './features/quiz/infrastructure/answers.repository';
import { QuizzesQueryRepository } from './features/quiz/infrastructure/quizzes.query-repository';
import { QuizPublicController } from './features/quiz/api/quiz.public.controller';
import { QuizQuestion } from './features/quiz/domain/quiz-question.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { BlogsBloggerController } from './features/blogs/api/blogs.blogger.controller';
import { BindBlogWithUserUseCase } from './features/blogs/application/use-cases/bind-blog.use-case';
import { UserBanByAdmin } from './features/bans/domain/user-ban-by-admin.entity';
import { UpdateUserBanInfoByAdminUseCase } from './features/bans/application/use-cases/update-user-ban-by-admin.use-case';
import { UsersBansByAdminRepository } from './features/bans/infrastructure/users-bans-by-admin-repository';
import { UpdateUserBanInfoByBloggerUseCase } from './features/bans/application/use-cases/update-user-ban-by-blogger.use-case';
import { UsersBansByBloggersRepository } from './features/bans/infrastructure/users-bans-by-bloggers-repository';
import { UsersBloggerController } from './features/users/api/users.blogger.controller';
import { UserBanByBloggers } from './features/bans/domain/user-ban-by-blogger.entity';
import { UpdateBlogBanInfoByAdminUseCase } from './features/bans/application/use-cases/update-blog-ban-by-admin.use-case';
import { BlogsBansByAdminRepository } from './features/bans/infrastructure/blogs-bans-by-admin-repository';
import { BlogBanByAdmin } from './features/bans/domain/blog-ban-by-admin.entity';
import { UploadBlogWallpaperToFsUseCase } from './features/files/images/application/use-cases/fs/upload-blog-wallpaper-to-fs.use-case';
import { FilesStorageAdapter } from './features/files/images/adapters/files-storage-adapter';
import { UploadBlogMainImageToFsUseCase } from './features/files/images/application/use-cases/fs/upload-blog-main-image-to-fs.use-case';
import { UploadPostMainImageToFsUseCase } from './features/files/images/application/use-cases/fs/upload-post-main-image-to-fs.use-case';
import { S3StorageAdapter } from './features/files/images/adapters/s3-storage-adapter';
import { UploadBlogMainImageToS3UseCase } from './features/files/images/application/use-cases/s3/upload-blog-main-image-to-s3.use-case';
import { UploadBlogWallpaperToS3UseCase } from './features/files/images/application/use-cases/s3/upload-blog-wallpaper-to-s3.use-case';
import { UploadPostMainImageToS3UseCase } from './features/files/images/application/use-cases/s3/upload-post-main-image-to-s3.use-case';
import { TelegramAdapter } from './features/integrations/telegram/adapters/telegram.adapter';
import { IntegrationsController } from './features/integrations/api/integrations.controller';
import { BlogSubscription } from './features/subscriptions/domain/blog-subscription.entity';
import { BlogsWallpapersRepository } from './features/files/images/infrastructure/blogs-wallpapers.repository';
import { BlogsMainImagesRepository } from './features/files/images/infrastructure/blogs-main-images.repository';
import { PostsMainImagesRepository } from './features/files/images/infrastructure/posts-main-images.repository';
import { BlogWallpaper } from './features/files/images/domain/wallpaper-blog.entity';
import { BlogMainImage } from './features/files/images/domain/main-image-blog.entity';
import { PostMainImage } from './features/files/images/domain/main-image-post.entity';
import { SubscribeUserToBlogUseCase } from './features/subscriptions/application/use-cases/subscribe-user-to-blog.use-case';
import { UnsubscribeUserToBlogUseCase } from './features/subscriptions/application/use-cases/unsubscribe-user-to-blog.use-case';
import { BlogsSubscriptionsRepository } from './features/subscriptions/infrastructure/blogs-subscriptions-repository';
import { BlogsSubscriptionsQueryRepository } from './features/subscriptions/infrastructure/blogs-subscriptions-query-repository';
import { SendTelegramNotificationToBlogSubscribersWhenPostCreatedEventHandler } from './features/posts/application/events-handlers/send-telegram-notification-to-blog-subscribers-when-post-created.event-handler';
import { GenerateAuthBotLinkUseCase } from './features/integrations/telegram/application/use-cases/generate-auth-bot-link.use-case';
import { AddTelegramNotificationToBlogSubscriptionUseCase } from './features/integrations/telegram/application/use-cases/add-telegram-notification-to-blog-subscription.use-case';
import { BuyMembershipPlanToBlogSubscriptionUseCase } from './features/memberships/application/use-cases/buy-membership-plan-to-blog-subscription.use-case';
import { BlogMembershipPlan } from './features/memberships/domain/blog-membership-plan.entity';
import { UpdateBlogMembershipUseCase } from './features/memberships/application/use-cases/update-blog-membership.use-case';
import { BlogsMembershipsPlansQueryRepository } from './features/memberships/infrastructure/blogs-memberships-plans-query-repository';
import { PaymentBlogMembership } from './features/memberships/domain/payment-blog-membership.entity';
import { PaymentsManager } from './features/memberships/managers/payments-manager';
import { StripeAdapter } from './features/memberships/adapters/stripe-adapter';
import { PaymentsBlogsMembershipsRepository } from './features/memberships/infrastructure/payments-blogs-memberships-repository';

config();

const mongoURI = process.env.MONGO_URL || 'mongodb://0.0.0.0:27017';

if (!mongoURI) {
  throw new Error(`Url doesn't found`);
}

const quizzesUseCases = [
  CreateQuestionUseCase,
  DeleteQuestionUseCase,
  UpdateQuestionUseCase,
  UpdatePublishQuestionUseCase,
  CreateOrConnectQuizUseCase,
  CreateAnswerUseCase,
];

const blogsUseCases = [
  UpdateBlogUseCase,
  DeleteBlogUseCase,
  CreateBlogUseCase,
  BindBlogWithUserUseCase,
  UpdateBlogBanInfoByAdminUseCase,
  UploadBlogWallpaperToFsUseCase,
  UploadBlogWallpaperToS3UseCase,
  UploadBlogMainImageToFsUseCase,
  UploadBlogMainImageToS3UseCase,
  SubscribeUserToBlogUseCase,
  UnsubscribeUserToBlogUseCase,
  BuyMembershipPlanToBlogSubscriptionUseCase,
  UpdateBlogMembershipUseCase,
];

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
  UploadPostMainImageToFsUseCase,
  UploadPostMainImageToS3UseCase,
];

const authUseCases = [
  UpdatePasswordForRecoveryUseCase,
  SendEmailForPasswordRecoveryUseCase,
  ResendingEmailUseCase,
  CreateUserByRegistrationUseCase,
  ConfirmEmailUseCase,
  CheckCredentialsUseCase,
];

const usersUseCases = [
  DeleteUserUseCase,
  CreateUserByAdminUseCase,
  UpdateUserBanInfoByAdminUseCase,
  UpdateUserBanInfoByBloggerUseCase,
];

const eventsHandlers = [
  SendTelegramNotificationToBlogSubscribersWhenPostCreatedEventHandler,
];

const servicesProviders = [AppService, JwtService];

const repositoriesProviders = [
  BlogsRepository,
  BlogsBansByAdminRepository,
  PostsRepository,
  UsersRepository,
  UsersBansByAdminRepository,
  UsersBansByBloggersRepository,
  DevicesRepository,
  CommentsRepository,
  LikesCommentsRepository,
  LikesPostsRepository,
  QuestionsRepository,
  QuizzesRepository,
  PlayersSessionsRepository,
  AnswersRepository,
  BlogsWallpapersRepository,
  BlogsMainImagesRepository,
  PostsMainImagesRepository,
  BlogsSubscriptionsRepository,
  BlogsSubscriptionsQueryRepository,
  BlogsMembershipsPlansQueryRepository,
  PaymentsBlogsMembershipsRepository,
];

const queryRepositoriesProviders = [
  BlogsQueryRepository,
  CommentsQueryRepository,
  UsersQueryRepository,
  PostsQueryRepository,
  DevicesQueryRepository,
  QuestionsQueryRepository,
  QuizzesQueryRepository,
];

const telegramUseCases = [
  GenerateAuthBotLinkUseCase,
  AddTelegramNotificationToBlogSubscriptionUseCase,
];

const telegramProviders = [TelegramAdapter];

const paymentsProviders = [PaymentsManager, StripeAdapter];

const imagesProviders = [FilesStorageAdapter, S3StorageAdapter];

const emailsProviders = [EmailsManager, EmailsAdapter];

const strategiesProviders = [LocalStrategy, JwtStrategy, BasicStrategy];

const constraintsProviders = [
  LoginExistConstraint,
  EmailExistConstraint,
  RecoveryCodeConstraint,
  CodeConfirmationConstraint,
  EmailExistAndConfirmedConstraint,
];

const controllers = [
  AppController,
  AuthController,
  DevicesController,
  BlogsSAController,
  BlogsBloggerController,
  BlogsPublicController,
  PostsController,
  CommentsController,
  UsersSAController,
  UsersBloggerController,
  TestController,
  QuizSAController,
  QuizPublicController,
  IntegrationsController,
];

const entities = [
  User,
  UserBanByAdmin,
  UserBanByBloggers,
  Device,
  Blog,
  BlogBanByAdmin,
  BlogWallpaper,
  BlogMainImage,
  Post,
  PostMainImage,
  LikePost,
  Comment,
  LikeComment,
  Question,
  Answer,
  Quiz,
  PlayerSession,
  QuizQuestion,
  BlogSubscription,
  BlogMembershipPlan,
  PaymentBlogMembership,
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
  synchronize: false,
};

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([...entities]),
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
  controllers: [...controllers],
  providers: [
    ...authUseCases,
    ...blogsUseCases,
    ...commentsUseCases,
    ...postsUseCases,
    ...devicesUseCases,
    ...usersUseCases,
    ...quizzesUseCases,
    ...telegramUseCases,
    ...servicesProviders,
    ...repositoriesProviders,
    ...queryRepositoriesProviders,
    ...emailsProviders,
    ...constraintsProviders,
    ...strategiesProviders,
    ...imagesProviders,
    ...telegramProviders,
    ...eventsHandlers,
    ...paymentsProviders,
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
      {
        path: '/blogs',
        method: RequestMethod.GET,
      },
      {
        path: '/blogs/:blogId',
        method: RequestMethod.GET,
      },
    );
  }
}
