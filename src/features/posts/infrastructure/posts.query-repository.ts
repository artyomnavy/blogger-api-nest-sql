import { Injectable } from '@nestjs/common';
import {
  PostMapperModel,
  PostOutputModel,
} from '../api/models/post.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { LikeStatuses } from '../../../common/utils';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Post } from '../domain/post.entity';
import { LikePost } from '../../likes/domain/like-post.entity';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectRepository(Post)
    private readonly postsQueryRepository: Repository<Post>,
  ) {}
  async getAllPostsForPublic(queryData: {
    query: PaginatorModel;
    userId?: string;
  }): Promise<PaginatorOutputModel<PostOutputModel>> {
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

    const userId = queryData.userId;

    const order = sortBy === 'blogName' ? `b.name` : `p.${sortBy}`;

    const posts = await this.postsQueryRepository
      .createQueryBuilder('p')
      .leftJoin('p.blog', 'b')
      .leftJoin('b.blogBanByAdmin', 'bba')
      .leftJoin('b.user', 'u')
      .leftJoin('u.userBanByAdmin', 'uba')
      .select([
        'p.id AS "id"',
        'p.title AS "title"',
        'p.shortDescription AS "shortDescription"',
        'p.content AS "content"',
        'p.blogId AS "blogId"',
        'p.createdAt AS "createdAt"',
        'b.name AS "blogName"',
      ])
      // Подзапрос количества лайков поста
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(lp.id)')
          .from(LikePost, 'lp')
          .leftJoin('lp.user', 'u')
          .leftJoin('u.userBanByAdmin', 'uba')
          .where('(lp.postId = p.id AND lp.status = :like)', {
            like: LikeStatuses.LIKE,
          })
          .andWhere('(uba.isBanned = :ban)', {
            ban: false,
          });
      }, 'likesCount')
      // Подзапрос количества дизлайков поста
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(lp.id)')
          .from(LikePost, 'lp')
          .leftJoin('lp.user', 'u')
          .leftJoin('u.userBanByAdmin', 'uba')
          .where('(lp.postId = p.id AND lp.status = :dislike)', {
            dislike: LikeStatuses.DISLIKE,
          })
          .andWhere('(uba.isBanned = :ban)', {
            ban: false,
          });
      }, 'dislikesCount')
      // Подзапрос статуса пользователя (лайк или дизлайк) для поста
      // Если userId не придет (запрос идет от посетителя), то подзапрос не будет выполняться
      .addSelect((subQuery) => {
        return subQuery
          .select('lp.status')
          .from(LikePost, 'lp')
          .where(
            'lp.postId = p.id AND lp.userId = :userId AND :userId IS NOT NULL',
            {
              userId: userId,
            },
          );
      }, 'myStatus')
      // Подзапрос последних 3 (трех) лайков поста с информацией о пользователях, которые поставили лайк
      .addSelect((subQuery) => {
        return subQuery
          .select(
            "json_agg(json_build_object('addedAt', sub_lp.added_at, 'userId', sub_lp.user_id, 'login', sub_lp.login))",
          )
          .from(
            (subQuery) =>
              subQuery
                .select('lp.addedAt, lp.userId, u.login')
                .from(LikePost, 'lp')
                .leftJoin('lp.user', 'u')
                .leftJoin('u.userBanByAdmin', 'uba')
                .where('(lp.postId = p.id AND lp.status = :status)', {
                  status: LikeStatuses.LIKE,
                })
                .andWhere('(uba.isBanned = :ban)', {
                  ban: false,
                })
                .orderBy('lp.addedAt', 'DESC')
                .limit(3),
            'sub_lp',
          );
      }, 'newestLikes')
      .where('(uba.isBanned = :ban)', { ban: false })
      .andWhere('(uba.isBanned = :ban)', { ban: false })
      .orderBy(order, sortDirection)
      .offset((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();

    const totalCount: number = await this.postsQueryRepository
      .createQueryBuilder('p')
      .leftJoin('p.blog', 'b')
      .leftJoin('b.blogBanByAdmin', 'bba')
      .leftJoin('b.user', 'u')
      .leftJoin('u.userBanByAdmin', 'uba')
      .select('COUNT(p.id)')
      .where('(uba.isBanned = :ban)', { ban: false })
      .andWhere('(uba.isBanned = :ban)', { ban: false })
      .getCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: await Promise.all(
        posts.map((post: PostMapperModel) => this.postMapper(post)),
      ),
    };
  }
  async getPostById(
    id: string,
    userId?: string,
  ): Promise<PostOutputModel | null> {
    const post = await this.postsQueryRepository
      .createQueryBuilder('p')
      .leftJoin('p.blog', 'b')
      .leftJoin('b.user', 'u')
      .leftJoin('u.userBanByAdmin', 'uba')
      .select([
        'p.id AS "id"',
        'p.title AS "title"',
        'p.shortDescription AS "shortDescription"',
        'p.content AS "content"',
        'p.blogId AS "blogId"',
        'p.createdAt AS "createdAt"',
        'b.name AS "blogName"',
      ])
      // Подзапрос количества лайков поста
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(lp.id)')
          .from(LikePost, 'lp')
          .leftJoin('lp.user', 'u')
          .leftJoin('u.userBanByAdmin', 'uba')
          .where('lp.postId = :id AND lp.status = :like', {
            id,
            like: LikeStatuses.LIKE,
          })
          .andWhere('(uba.isBanned = :ban)', {
            ban: false,
          });
      }, 'likesCount')
      // Подзапрос количества дизлайков поста
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(lp.id)')
          .from(LikePost, 'lp')
          .leftJoin('lp.user', 'u')
          .leftJoin('u.userBanByAdmin', 'uba')
          .where('lp.postId = :id AND lp.status = :dislike', {
            id,
            dislike: LikeStatuses.DISLIKE,
          })
          .andWhere('(uba.isBanned = :ban)', {
            ban: false,
          });
      }, 'dislikesCount')
      // Подзапрос статуса пользователя (лайк или дизлайк) для поста
      // Если userId не придет (запрос идет от посетителя), то подзапрос не будет выполняться
      .addSelect((subQuery) => {
        return subQuery
          .select('lp.status')
          .from(LikePost, 'lp')
          .where(
            'lp.postId = :id AND lp.userId = :userId AND :userId IS NOT NULL',
            {
              id,
              userId: userId,
            },
          );
      }, 'myStatus')
      // Подзапрос последних 3 (трех) лайков поста с информацией о пользователях, которые поставили лайк
      .addSelect((subQuery) => {
        return subQuery
          .select(
            "json_agg(json_build_object('addedAt', sub_lp.added_at, 'userId', sub_lp.user_id, 'login', sub_lp.login))",
          )
          .from(
            (subQuery) =>
              subQuery
                .select('lp.addedAt, lp.userId, u.login')
                .from(LikePost, 'lp')
                .leftJoin('lp.user', 'u')
                .leftJoin('u.userBanByAdmin', 'uba')
                .where('lp.postId = :id AND lp.status = :status', {
                  id,
                  status: LikeStatuses.LIKE,
                })
                .andWhere('(uba.isBanned = :ban)', {
                  ban: false,
                })
                .orderBy('lp.addedAt', 'DESC')
                .limit(3),
            'sub_lp',
          );
      }, 'newestLikes')
      .where('(p.id = :id)', { id })
      .andWhere('(uba.isBanned = :ban)', { ban: false })
      .getRawOne();

    if (!post) {
      return null;
    } else {
      return await this.postMapper(post);
    }
  }
  async getPostsForBlog(queryData: {
    query: PaginatorModel;
    blogId: string;
    userId?: string;
  }): Promise<PaginatorOutputModel<PostOutputModel>> {
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
    const blogId = queryData.blogId;
    const userId = queryData.userId;

    const order = sortBy === 'blogName' ? `b.name` : `p.${sortBy}`;

    const posts = await this.postsQueryRepository
      .createQueryBuilder('p')
      .leftJoin('p.blog', 'b')
      .leftJoin('b.user', 'u')
      .leftJoin('u.userBanByAdmin', 'uba')
      .select([
        'p.id AS "id"',
        'p.title AS "title"',
        'p.shortDescription AS "shortDescription"',
        'p.content AS "content"',
        'p.blogId AS "blogId"',
        'p.createdAt AS "createdAt"',
        'b.name AS "blogName"',
      ])
      // Подзапрос количества лайков поста
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(lp.id)')
          .from(LikePost, 'lp')
          .leftJoin('lp.user', 'u')
          .leftJoin('u.userBanByAdmin', 'uba')
          .where('(lp.postId = p.id AND lp.status = :like)', {
            like: LikeStatuses.LIKE,
          })
          .andWhere('(uba.isBanned = :ban)', {
            ban: false,
          });
      }, 'likesCount')
      // Подзапрос количества дизлайков поста
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(lp.id)')
          .from(LikePost, 'lp')
          .leftJoin('lp.user', 'u')
          .leftJoin('u.userBanByAdmin', 'uba')
          .where('(lp.postId = p.id AND lp.status = :dislike)', {
            dislike: LikeStatuses.DISLIKE,
          })
          .andWhere('(uba.isBanned = :ban)', {
            ban: false,
          });
      }, 'dislikesCount')
      // Подзапрос статуса пользователя (лайк или дизлайк) для поста
      // Если userId не придет (запрос идет от посетителя), то подзапрос не будет выполняться
      .addSelect((subQuery) => {
        return subQuery
          .select('lp.status')
          .from(LikePost, 'lp')
          .where(
            'lp.postId = p.id AND lp.userId = :userId AND :userId IS NOT NULL',
            {
              userId: userId,
            },
          );
      }, 'myStatus')
      // Подзапрос последних 3 (трех) лайков поста с информацией о пользователях, которые поставили лайк
      .addSelect((subQuery) => {
        return subQuery
          .select(
            "json_agg(json_build_object('addedAt', sub_lp.added_at, 'userId', sub_lp.user_id, 'login', sub_lp.login))",
          )
          .from(
            (subQuery) =>
              subQuery
                .select('lp.addedAt, lp.userId, u.login')
                .from(LikePost, 'lp')
                .leftJoin('lp.user', 'u')
                .leftJoin('u.userBanByAdmin', 'uba')
                .where('(lp.postId = p.id AND lp.status = :status)', {
                  status: LikeStatuses.LIKE,
                })
                .andWhere('(uba.isBanned = :ban)', {
                  ban: false,
                })
                .orderBy('lp.addedAt', 'DESC')
                .limit(3),
            'sub_lp',
          );
      }, 'newestLikes')
      .where('p.blogId = :blogId', { blogId: blogId })
      .andWhere('(uba.isBanned = :ban)', { ban: false })
      .orderBy(order, sortDirection)
      .offset((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();

    const totalCount: number = await this.postsQueryRepository
      .createQueryBuilder('p')
      .leftJoin('p.blog', 'b')
      .leftJoin('b.user', 'u')
      .leftJoin('u.userBanByAdmin', 'uba')
      .select('COUNT(p.id)')
      .where('(p.blogId = :blogId)', {
        blogId: blogId,
      })
      .andWhere('(uba.isBanned = :ban)', { ban: false })
      .getCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: await Promise.all(
        posts.map((post: PostMapperModel) => this.postMapper(post)),
      ),
    };
  }
  async getPostByIdForPublic(
    id: string,
    userId?: string,
  ): Promise<PostOutputModel | null> {
    const post = await this.postsQueryRepository
      .createQueryBuilder('p')
      .leftJoin('p.blog', 'b')
      .leftJoin('b.blogBanByAdmin', 'bba')
      .leftJoin('b.user', 'u')
      .leftJoin('u.userBanByAdmin', 'uba')
      .select([
        'p.id AS "id"',
        'p.title AS "title"',
        'p.shortDescription AS "shortDescription"',
        'p.content AS "content"',
        'p.blogId AS "blogId"',
        'p.createdAt AS "createdAt"',
        'b.name AS "blogName"',
      ])
      // Подзапрос количества лайков поста
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(lp.id)')
          .from(LikePost, 'lp')
          .leftJoin('lp.user', 'u')
          .leftJoin('u.userBanByAdmin', 'uba')
          .where('lp.postId = :id AND lp.status = :like', {
            id,
            like: LikeStatuses.LIKE,
          })
          .andWhere('(uba.isBanned = :ban)', {
            ban: false,
          });
      }, 'likesCount')
      // Подзапрос количества дизлайков поста
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(lp.id)')
          .from(LikePost, 'lp')
          .leftJoin('lp.user', 'u')
          .leftJoin('u.userBanByAdmin', 'uba')
          .where('lp.postId = :id AND lp.status = :dislike', {
            id,
            dislike: LikeStatuses.DISLIKE,
          })
          .andWhere('(uba.isBanned = :ban)', {
            ban: false,
          });
      }, 'dislikesCount')
      // Подзапрос статуса пользователя (лайк или дизлайк) для поста
      // Если userId не придет (запрос идет от посетителя), то подзапрос не будет выполняться
      .addSelect((subQuery) => {
        return subQuery
          .select('lp.status')
          .from(LikePost, 'lp')
          .where(
            'lp.postId = :id AND lp.userId = :userId AND :userId IS NOT NULL',
            {
              id,
              userId: userId,
            },
          );
      }, 'myStatus')
      // Подзапрос последних 3 (трех) лайков поста с информацией о пользователях, которые поставили лайк
      .addSelect((subQuery) => {
        return subQuery
          .select(
            "json_agg(json_build_object('addedAt', sub_lp.added_at, 'userId', sub_lp.user_id, 'login', sub_lp.login))",
          )
          .from(
            (subQuery) =>
              subQuery
                .select('lp.addedAt, lp.userId, u.login')
                .from(LikePost, 'lp')
                .leftJoin('lp.user', 'u')
                .leftJoin('u.userBanByAdmin', 'uba')
                .where('lp.postId = :id AND lp.status = :status', {
                  id,
                  status: LikeStatuses.LIKE,
                })
                .andWhere('(uba.isBanned = :ban)', {
                  ban: false,
                })
                .orderBy('lp.addedAt', 'DESC')
                .limit(3),
            'sub_lp',
          );
      }, 'newestLikes')
      .where('(p.id = :id)', { id })
      .andWhere('(bba.isBanned = :ban)', { ban: false })
      .andWhere('(uba.isBanned = :ban)', { ban: false })
      .getRawOne();

    if (!post) {
      return null;
    } else {
      return await this.postMapper(post);
    }
  }
  async getPostsBlogForPublic(queryData: {
    query: PaginatorModel;
    blogId: string;
    userId?: string;
  }): Promise<PaginatorOutputModel<PostOutputModel>> {
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
    const blogId = queryData.blogId;
    const userId = queryData.userId;

    const order = sortBy === 'blogName' ? `b.name` : `p.${sortBy}`;

    const posts = await this.postsQueryRepository
      .createQueryBuilder('p')
      .leftJoin('p.blog', 'b')
      .leftJoin('b.blogBanByAdmin', 'bba')
      .leftJoin('b.user', 'u')
      .leftJoin('u.userBanByAdmin', 'uba')
      .select([
        'p.id AS "id"',
        'p.title AS "title"',
        'p.shortDescription AS "shortDescription"',
        'p.content AS "content"',
        'p.blogId AS "blogId"',
        'p.createdAt AS "createdAt"',
        'b.name AS "blogName"',
      ])
      // Подзапрос количества лайков поста
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(lp.id)')
          .from(LikePost, 'lp')
          .leftJoin('lp.user', 'u')
          .leftJoin('u.userBanByAdmin', 'uba')
          .where('(lp.postId = p.id AND lp.status = :like)', {
            like: LikeStatuses.LIKE,
          })
          .andWhere('(uba.isBanned = :ban)', {
            ban: false,
          });
      }, 'likesCount')
      // Подзапрос количества дизлайков поста
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(lp.id)')
          .from(LikePost, 'lp')
          .leftJoin('lp.user', 'u')
          .leftJoin('u.userBanByAdmin', 'uba')
          .where('(lp.postId = p.id AND lp.status = :dislike)', {
            dislike: LikeStatuses.DISLIKE,
          })
          .andWhere('(uba.isBanned = :ban)', {
            ban: false,
          });
      }, 'dislikesCount')
      // Подзапрос статуса пользователя (лайк или дизлайк) для поста
      // Если userId не придет (запрос идет от посетителя), то подзапрос не будет выполняться
      .addSelect((subQuery) => {
        return subQuery
          .select('lp.status')
          .from(LikePost, 'lp')
          .where(
            'lp.postId = p.id AND lp.userId = :userId AND :userId IS NOT NULL',
            {
              userId: userId,
            },
          );
      }, 'myStatus')
      // Подзапрос последних 3 (трех) лайков поста с информацией о пользователях, которые поставили лайк
      .addSelect((subQuery) => {
        return subQuery
          .select(
            "json_agg(json_build_object('addedAt', sub_lp.added_at, 'userId', sub_lp.user_id, 'login', sub_lp.login))",
          )
          .from(
            (subQuery) =>
              subQuery
                .select('lp.addedAt, lp.userId, u.login')
                .from(LikePost, 'lp')
                .leftJoin('lp.user', 'u')
                .leftJoin('u.userBanByAdmin', 'uba')
                .where('(lp.postId = p.id AND lp.status = :status)', {
                  status: LikeStatuses.LIKE,
                })
                .andWhere('(uba.isBanned = :ban)', {
                  ban: false,
                })
                .orderBy('lp.addedAt', 'DESC')
                .limit(3),
            'sub_lp',
          );
      }, 'newestLikes')
      .where('p.blogId = :blogId', { blogId: blogId })
      .andWhere('(uba.isBanned = :ban)', { ban: false })
      .andWhere('(bba.isBanned = :ban)', { ban: false })
      .orderBy(order, sortDirection)
      .offset((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();

    const totalCount: number = await this.postsQueryRepository
      .createQueryBuilder('p')
      .leftJoin('p.blog', 'b')
      .leftJoin('b.blogBanByAdmin', 'bba')
      .leftJoin('b.user', 'u')
      .leftJoin('u.userBanByAdmin', 'uba')
      .select('COUNT(p.id)')
      .where('(p.blogId = :blogId)', {
        blogId: blogId,
      })
      .andWhere('(uba.isBanned = :ban)', { ban: false })
      .andWhere('(bba.isBanned = :ban)', { ban: false })
      .getCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: await Promise.all(
        posts.map((post: PostMapperModel) => this.postMapper(post)),
      ),
    };
  }
  async getOrmPostById(
    postId: string,
    manager?: EntityManager,
  ): Promise<Post | null> {
    const postsQueryRepository = manager
      ? manager.getRepository(Post)
      : this.postsQueryRepository;

    const post = await postsQueryRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      return null;
    } else {
      return post;
    }
  }

  async postMapper(post: PostMapperModel): Promise<PostOutputModel> {
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt.toISOString(),
      extendedLikesInfo: {
        likesCount: +post.likesCount,
        dislikesCount: +post.dislikesCount,
        myStatus: post.myStatus || LikeStatuses.NONE,
        newestLikes:
          post.newestLikes && post.newestLikes.length > 0
            ? post.newestLikes.map((like) => {
                return {
                  addedAt: like.addedAt,
                  userId: like.userId,
                  login: like.login,
                };
              })
            : [],
      },
    };
  }
}
