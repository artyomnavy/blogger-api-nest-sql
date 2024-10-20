import { Controller, Delete, HttpCode } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { HTTP_STATUSES } from '../common/utils';
import { User } from './users/domain/user.entity';
import { Device } from './devices/domain/device.entity';
import { Blog } from './blogs/domain/blog.entity';
import { Post } from './posts/domain/post.entity';
import { LikePost } from './likes/domain/like-post.entity';
import { Comment } from './comments/domain/comment.entity';
import { LikeComment } from './likes/domain/like-comment.entity';
import { Quiz } from './quiz/domain/quiz.entity';
import { Question } from './quiz/domain/question.entity';
import { Answer } from './quiz/domain/answer.entity';
import { QuizQuestion } from './quiz/domain/quiz-question.entity';
import { UserBanByAdmin } from './bans/domain/user-ban-by-admin.entity';
import { BlogBanByAdmin } from './bans/domain/blog-ban-by-admin.entity';
import { BlogWallpaper } from './files/images/domain/wallpaper-blog.entity';
import { BlogMainImage } from './files/images/domain/main-image-blog.entity';
import { PostMainImage } from './files/images/domain/main-image-post.entity';
import { BlogSubscription } from './subscriptions/domain/blog-subscription.entity';
import { BlogMembershipPlan } from './memberships/domain/blog-membership-plan.entity';
import { PaymentBlogMembership } from './integrations/payments/domain/payment-blog-membership.entity';
import { PlayerSession } from './quiz/domain/player-session.entity';
import { UserBanByBloggers } from './bans/domain/user-ban-by-blogger.entity';

@Controller('testing')
export class TestController {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Blog)
    private readonly blogsRepository: Repository<Blog>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(LikePost)
    private readonly likesPostsRepository: Repository<LikePost>,
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(LikeComment)
    private readonly likesCommentsRepository: Repository<LikeComment>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Device)
    private readonly devicesRepository: Repository<Device>,
    @InjectRepository(Quiz)
    private readonly quizzesRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    @InjectRepository(Answer)
    private readonly answersRepository: Repository<Answer>,
    @InjectRepository(QuizQuestion)
    private readonly quizzesQuestionsRepository: Repository<QuizQuestion>,
    // @InjectRepository(PlayerSession)
    // private readonly playersSessionsRepository: Repository<PlayerSession>,
    @InjectRepository(BlogWallpaper)
    private readonly blogsWallpapersRepository: Repository<BlogWallpaper>,
    @InjectRepository(BlogMainImage)
    private readonly blogsMainImagesRepository: Repository<BlogMainImage>,
    @InjectRepository(PostMainImage)
    private readonly postsMainImagesRepository: Repository<PostMainImage>,
    @InjectRepository(BlogSubscription)
    private readonly blogsSubscriptionsRepository: Repository<BlogSubscription>,
    @InjectRepository(BlogMembershipPlan)
    private readonly blogsMembershipsPlansRepository: Repository<BlogMembershipPlan>,
    @InjectRepository(PaymentBlogMembership)
    private readonly paymentsBlogsMembershipsRepository: Repository<PaymentBlogMembership>,
    @InjectRepository(BlogBanByAdmin)
    private readonly blogsBansByAdminRepository: Repository<BlogBanByAdmin>,
    @InjectRepository(UserBanByAdmin)
    private readonly usersBansByAdminRepository: Repository<UserBanByAdmin>,
    @InjectRepository(UserBanByBloggers)
    private readonly usersBansByBloggersRepository: Repository<UserBanByBloggers>,
  ) {}

  @Delete('all-data')
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async deleteAll() {
    await this.blogsRepository
      .createQueryBuilder()
      .delete()
      .from(Blog)
      .execute();
    await this.blogsBansByAdminRepository
      .createQueryBuilder()
      .delete()
      .from(BlogBanByAdmin)
      .execute();
    await this.blogsWallpapersRepository
      .createQueryBuilder()
      .delete()
      .from(BlogWallpaper)
      .execute();
    await this.blogsMainImagesRepository
      .createQueryBuilder()
      .delete()
      .from(BlogMainImage)
      .execute();
    await this.blogsSubscriptionsRepository
      .createQueryBuilder()
      .delete()
      .from(BlogSubscription)
      .execute();
    await this.blogsMembershipsPlansRepository
      .createQueryBuilder()
      .delete()
      .from(BlogMembershipPlan)
      .execute();
    await this.paymentsBlogsMembershipsRepository
      .createQueryBuilder()
      .delete()
      .from(PaymentBlogMembership)
      .execute();
    await this.postsRepository
      .createQueryBuilder()
      .delete()
      .from(Post)
      .execute();
    await this.likesPostsRepository
      .createQueryBuilder()
      .delete()
      .from(LikePost)
      .execute();
    await this.postsMainImagesRepository
      .createQueryBuilder()
      .delete()
      .from(PostMainImage)
      .execute();
    await this.commentsRepository
      .createQueryBuilder()
      .delete()
      .from(Comment)
      .execute();
    await this.likesCommentsRepository
      .createQueryBuilder()
      .delete()
      .from(LikeComment)
      .execute();
    await this.devicesRepository
      .createQueryBuilder()
      .delete()
      .from(Device)
      .execute();
    await this.usersRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .execute();
    await this.usersBansByAdminRepository
      .createQueryBuilder()
      .delete()
      .from(UserBanByAdmin)
      .execute();
    await this.usersBansByBloggersRepository
      .createQueryBuilder()
      .delete()
      .from(UserBanByAdmin)
      .execute();
    await this.quizzesRepository
      .createQueryBuilder()
      .delete()
      .from(Quiz)
      .execute();
    await this.questionsRepository
      .createQueryBuilder()
      .delete()
      .from(Question)
      .execute();
    await this.answersRepository
      .createQueryBuilder()
      .delete()
      .from(Answer)
      .execute();
    await this.quizzesQuestionsRepository
      .createQueryBuilder()
      .delete()
      .from(QuizQuestion)
      .execute();
    return;
  }
}
