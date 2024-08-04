import { Injectable } from '@nestjs/common';
import {
  CommentMapperModel,
  CommentMapperModelForBlogger,
  CommentOutputForBloggerModel,
  CommentOutputModel,
} from '../api/models/comment.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { LikeStatuses } from '../../../common/utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../domain/comment.entity';
import { LikeComment } from '../../likes/domain/like-comment.entity';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsQueryRepository: Repository<Comment>,
  ) {}
  async getCommentById(
    id: string,
    userId?: string | null,
  ): Promise<CommentOutputModel | null> {
    const comment = await this.commentsQueryRepository
      .createQueryBuilder('c')
      .leftJoin('c.user', 'u')
      .leftJoin('u.userBanByAdmin', 'uba')
      .select([
        'c.id AS "id"',
        'c.content AS "content"',
        'c.userId AS "userId"',
        'c.createdAt AS "createdAt"',
        'c.postId AS "postId"',
        'u.login AS "userLogin"',
      ])
      // Подзапрос количества лайков комментария
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(lc.id)')
          .from(LikeComment, 'lc')
          .leftJoin('lc.user', 'u')
          .leftJoin('u.userBanByAdmin', 'uba')
          .where('(lc.commentId = :id AND lc.status = :like)', {
            id,
            like: LikeStatuses.LIKE,
          })
          .andWhere('(uba.isBanned = :ban)', {
            ban: false,
          });
      }, 'likesCount')
      // Подзапрос количества дизлайков комментария
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(lc.id)')
          .from(LikeComment, 'lc')
          .leftJoin('lc.user', 'u')
          .leftJoin('u.userBanByAdmin', 'uba')
          .where('(lc.commentId = :id AND lc.status = :dislike)', {
            id,
            dislike: LikeStatuses.DISLIKE,
          })
          .andWhere('(uba.isBanned = :ban)', {
            ban: false,
          });
      }, 'dislikesCount')
      // Подзапрос статуса пользователя (лайк или дизлайк) для комментария
      // Если userId не придет (запрос идет от посетителя), то подзапрос не будет выполняться
      .addSelect((subQuery) => {
        return subQuery
          .select('lc.status')
          .from(LikeComment, 'lc')
          .where(
            '(lc.commentId = :id AND lc.userId = :userId AND :userId IS NOT NULL)',
            {
              id,
              userId: userId,
            },
          );
      }, 'myStatus')
      .where('(c.id = :id AND uba.isBanned = :ban)', {
        id,
        ban: false,
      })
      .getRawOne();

    if (!comment) {
      return null;
    } else {
      return await this.commentMapper(comment);
    }
  }
  async getCommentsByPostId(
    queryData: { query: PaginatorModel } & { postId: string } & {
      userId?: string;
    },
  ): Promise<PaginatorOutputModel<CommentOutputModel>> {
    const pageNumber = queryData.query.pageNumber
      ? +queryData.query.pageNumber
      : 1;
    const pageSize = queryData.query.pageSize ? +queryData.query.pageSize : 10;
    const sortBy = queryData.query.sortBy
      ? queryData.query.sortBy
      : 'createdAt';
    const sortDirection = queryData.query.sortDirection
      ? (queryData.query.sortDirection.toUpperCase() as 'ASC' | 'DESC')
      : 'DESC';
    const postId = queryData.postId;
    const userId = queryData.userId;

    const order = sortBy === 'userLogin' ? `u.login` : `c.${sortBy}`;

    const comments = await this.commentsQueryRepository
      .createQueryBuilder('c')
      .leftJoin('c.user', 'u')
      .leftJoin('u.userBanByAdmin', 'uba')
      .select([
        'c.id AS "id"',
        'c.content AS "content"',
        'c.userId AS "userId"',
        'c.createdAt AS "createdAt"',
        'c.postId AS "postId"',
        'u.login AS "userLogin"',
      ])
      // Подзапрос количества лайков комментария
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(lc.id)')
          .from(LikeComment, 'lc')
          .leftJoin('lc.user', 'u')
          .leftJoin('u.userBanByAdmin', 'uba')
          .where('(lc.commentId = c.id AND lc.status = :like)', {
            like: LikeStatuses.LIKE,
          })
          .andWhere('(uba.isBanned = :ban)', {
            ban: false,
          });
      }, 'likesCount')
      // Подзапрос количества дизлайков комментария
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(lc.id)')
          .from(LikeComment, 'lc')
          .leftJoin('lc.user', 'u')
          .leftJoin('u.userBanByAdmin', 'uba')
          .where('(lc.commentId = c.id AND lc.status = :dislike)', {
            dislike: LikeStatuses.DISLIKE,
          })
          .andWhere('(uba.isBanned = :ban)', {
            ban: false,
          });
      }, 'dislikesCount')
      // Подзапрос статуса пользователя (лайк или дизлайк) для комментария
      // Если userId не придет (запрос идет от посетителя), то подзапрос не будет выполняться
      .addSelect((subQuery) => {
        return subQuery
          .select('lc.status')
          .from(LikeComment, 'lc')
          .where(
            '(lc.commentId = c.id AND lc.userId = :userId AND :userId IS NOT NULL)',
            {
              userId: userId,
            },
          );
      }, 'myStatus')
      .where('c.postId = :postId AND uba.isBanned = :ban', {
        postId: postId,
        ban: false,
      })
      .orderBy(order, sortDirection)
      .offset((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();

    const totalCount: number = await this.commentsQueryRepository
      .createQueryBuilder('c')
      .select('COUNT(c.id)')
      .leftJoin('c.user', 'u')
      .leftJoin('u.userBanByAdmin', 'uba')
      .where('c.postId = :postId AND uba.isBanned = :ban', {
        postId: postId,
        ban: false,
      })
      .getCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: await Promise.all(
        comments.map((comment: CommentMapperModel) =>
          this.commentMapper(comment),
        ),
      ),
    };
  }
  async getAllCommentsPostsForBlogger(
    queryData: PaginatorModel,
    userId: string,
  ): Promise<PaginatorOutputModel<CommentOutputForBloggerModel>> {
    const pageNumber = queryData.pageNumber ? +queryData.pageNumber : 1;
    const pageSize = queryData.pageSize ? +queryData.pageSize : 10;
    const sortBy = queryData.sortBy ? queryData.sortBy : 'createdAt';
    const sortDirection = queryData.sortDirection
      ? (queryData.sortDirection.toUpperCase() as 'ASC' | 'DESC')
      : 'DESC';

    const order = sortBy === 'userLogin' ? `u.login` : `c.${sortBy}`;

    const comments = await this.commentsQueryRepository
      .createQueryBuilder('c')
      .leftJoin('c.post', 'p')
      .leftJoin('c.user', 'u')
      .leftJoin('p.blog', 'b')
      .leftJoin('b.user', 'bu')
      .leftJoin('bu.userBanByAdmin', 'uba')
      .select([
        'c.id AS "id"',
        'c.content AS "content"',
        'c.userId AS "userId"',
        'c.createdAt AS "createdAt"',
        'c.postId AS "postId"',
        'u.login AS "userLogin"',
        'p.title AS "postTitle"',
        'b.id AS "blogId"',
        'b.name AS "blogName"',
      ])
      // Подзапрос количества лайков комментария
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(lc.id)')
          .from(LikeComment, 'lc')
          .leftJoin('lc.user', 'u')
          .leftJoin('u.userBanByAdmin', 'uba')
          .where('(lc.commentId = c.id AND lc.status = :like)', {
            like: LikeStatuses.LIKE,
          })
          .andWhere('(uba.isBanned = :ban)', {
            ban: false,
          });
      }, 'likesCount')
      // Подзапрос количества дизлайков комментария
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(lc.id)')
          .from(LikeComment, 'lc')
          .leftJoin('lc.user', 'u')
          .leftJoin('u.userBanByAdmin', 'uba')
          .where('(lc.commentId = c.id AND lc.status = :dislike)', {
            dislike: LikeStatuses.DISLIKE,
          })
          .andWhere('(uba.isBanned = :ban)', {
            ban: false,
          });
      }, 'dislikesCount')
      // Подзапрос статуса пользователя (лайк или дизлайк) для комментария
      // Если userId не придет (запрос идет от посетителя), то подзапрос не будет выполняться
      .addSelect((subQuery) => {
        return subQuery
          .select('lc.status')
          .from(LikeComment, 'lc')
          .where(
            '(lc.commentId = c.id AND lc.userId = :userId AND :userId IS NOT NULL)',
            {
              userId: userId,
            },
          );
      }, 'myStatus')
      .where('(bu.id = :userId AND uba.isBanned = :ban)', {
        userId: userId,
        ban: false,
      })
      .orderBy(order, sortDirection)
      .offset((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();

    const totalCount: number = await this.commentsQueryRepository
      .createQueryBuilder('c')
      .select('COUNT(c.id)')
      .leftJoin('c.post', 'p')
      .leftJoin('c.user', 'u')
      .leftJoin('p.blog', 'b')
      .leftJoin('b.user', 'bu')
      .leftJoin('bu.userBanByAdmin', 'uba')
      .where('(bu.id = :userId AND uba.isBanned = :ban)', {
        userId: userId,
        ban: false,
      })
      .getCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: await Promise.all(
        comments.map((comment: CommentMapperModelForBlogger) =>
          this.commentWithPostInfoMapperForBlogger(comment),
        ),
      ),
    };
  }
  async commentMapper(
    comment: CommentMapperModel,
  ): Promise<CommentOutputModel> {
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt.toISOString(),
      likesInfo: {
        likesCount: +comment.likesCount,
        dislikesCount: +comment.dislikesCount,
        myStatus: comment.myStatus || LikeStatuses.NONE,
      },
    };
  }
  async commentWithPostInfoMapperForBlogger(
    comment: CommentMapperModelForBlogger,
  ): Promise<CommentOutputForBloggerModel> {
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt.toISOString(),
      likesInfo: {
        likesCount: +comment.likesCount,
        dislikesCount: +comment.dislikesCount,
        myStatus: comment.myStatus || LikeStatuses.NONE,
      },
      postInfo: {
        id: comment.postId,
        title: comment.postTitle,
        blogId: comment.blogId,
        blogName: comment.blogName,
      },
    };
  }
}
