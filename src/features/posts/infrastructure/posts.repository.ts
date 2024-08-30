import { Injectable } from '@nestjs/common';
import { PostModel, PostOutputModel } from '../api/models/post.output.model';
import { CreateAndUpdatePostModel } from '../api/models/post.input.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../domain/post.entity';
import { LikeStatuses } from '../../../common/utils';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}
  async createPost(
    newPost: PostModel,
    blogName: string,
  ): Promise<PostOutputModel> {
    await this.postsRepository
      .createQueryBuilder()
      .insert()
      .into(Post)
      .values(newPost)
      .execute();

    return {
      id: newPost.id,
      title: newPost.title,
      shortDescription: newPost.shortDescription,
      content: newPost.content,
      blogId: newPost.blogId,
      blogName: blogName,
      createdAt: newPost.createdAt.toISOString(),
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatuses.NONE,
        newestLikes: [],
      },
      images: {
        main: [],
      },
    };
  }
  async updatePost(
    id: string,
    updateData: CreateAndUpdatePostModel,
  ): Promise<boolean> {
    const resultUpdatePost = await this.postsRepository
      .createQueryBuilder()
      .update(Post)
      .set({
        title: updateData.title,
        shortDescription: updateData.shortDescription,
        content: updateData.content,
      })
      .where('id = :id', { id })
      .execute();

    return resultUpdatePost.affected === 1;
  }
  async deletePost(id: string): Promise<boolean> {
    const resultDeletePost = await this.postsRepository
      .createQueryBuilder()
      .delete()
      .from(Post)
      .where('id = :id', { id })
      .execute();

    return resultDeletePost.affected === 1;
  }
}
