import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument } from '../domain/post.entity';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { PostModel, PostOutputModel } from '../api/models/post.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { likesStatuses } from '../../../utils';
import { LikesQueryRepository } from '../../likes/infrastructure/likes.query-repository';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    protected likesQueryRepository: LikesQueryRepository,
  ) {}
  async getAllPosts(
    queryData: { query: PaginatorModel } & { userId?: string | null },
  ): Promise<PaginatorOutputModel<PostOutputModel>> {
    const pageNumber = queryData.query.pageNumber
      ? queryData.query.pageNumber
      : 1;
    const pageSize = queryData.query.pageSize ? queryData.query.pageSize : 10;
    const sortBy = queryData.query.sortBy
      ? queryData.query.sortBy
      : 'createdAt';
    const sortDirection = queryData.query.sortDirection
      ? queryData.query.sortDirection
      : 'desc';

    const userId = queryData.userId;

    const posts = await this.postModel
      .find({})
      .sort({
        [sortBy]: sortDirection === 'desc' ? -1 : 1,
      })
      .skip((+pageNumber - 1) * +pageSize)
      .limit(+pageSize);

    const totalCount = await this.postModel.countDocuments({});
    const pagesCount = Math.ceil(+totalCount / +pageSize);

    return {
      pagesCount: pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: +totalCount,
      items: await Promise.all(
        posts.map((post) => this.postMapper(post, userId)),
      ),
    };
  }

  async getPostById(
    postId: string,
    userId?: string | null,
  ): Promise<PostOutputModel | null> {
    const post = await this.postModel.findOne({
      _id: new ObjectId(postId),
    });

    if (!post) {
      return null;
    } else {
      return await this.postMapper(post, userId);
    }
  }

  async getPostsByBlogId(
    queryData: { query: PaginatorModel } & { blogId: string } & {
      userId?: string | null;
    },
  ): Promise<PaginatorOutputModel<PostOutputModel>> {
    const pageNumber = queryData.query.pageNumber
      ? queryData.query.pageNumber
      : 1;
    const pageSize = queryData.query.pageSize ? queryData.query.pageSize : 10;
    const sortBy = queryData.query.sortBy
      ? queryData.query.sortBy
      : 'createdAt';
    const sortDirection = queryData.query.sortDirection
      ? queryData.query.sortDirection
      : 'desc';
    const blogId = queryData.blogId;
    const userId = queryData.userId;

    const filter = {
      blogId: {
        $regex: blogId,
      },
    };

    const posts = await this.postModel
      .find(filter)
      .sort({
        [sortBy]: sortDirection === 'desc' ? -1 : 1,
      })
      .skip((+pageNumber - 1) * +pageSize)
      .limit(+pageSize);

    const totalCount = await this.postModel.countDocuments(filter);
    const pagesCount = Math.ceil(+totalCount / +pageSize);

    return {
      pagesCount: pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: +totalCount,
      items: await Promise.all(
        posts.map((post) => this.postMapper(post, userId)),
      ),
    };
  }
  async postMapper(post: PostModel, userId?: string | null) {
    let likeStatus: string | null = null;

    if (userId) {
      const like = await this.likesQueryRepository.getLikeCommentOrPostForUser(
        post._id.toString(),
        userId,
      );

      if (like) {
        likeStatus = like.status;
      }
    }

    const newestLikes = await this.likesQueryRepository.getNewestLikesForPost(
      post._id.toString(),
    );

    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt.toISOString(),
      extendedLikesInfo: {
        likesCount: post.extendedLikesInfo.likesCount,
        dislikesCount: post.extendedLikesInfo.dislikesCount,
        myStatus: likeStatus || likesStatuses.none,
        newestLikes: newestLikes,
      },
    };
  }
}
