import { Injectable } from '@nestjs/common';
import { PostModel, PostOutputModel } from '../api/models/post.output.model';
import { CreateAndUpdatePostModel } from '../api/models/post.input.model';
import { PostsQueryRepository } from './posts.query-repository';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { likesStatuses } from '../../../utils';

@Injectable()
export class PostsRepository {
  constructor(
    protected postsQueryRepository: PostsQueryRepository,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}
  async createPost(
    newPost: PostModel,
    blogName: string,
  ): Promise<PostOutputModel> {
    const query = `INSERT INTO public."Posts"(
            "id", "title", "shortDescription", "content", "blogId", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6)`;

    await this.dataSource.query(query, [
      newPost.id,
      newPost.title,
      newPost.shortDescription,
      newPost.content,
      newPost.blogId,
      newPost.createdAt,
    ]);

    return await this.postsQueryRepository.postMapper({
      ...newPost,
      blogName,
      likesCount: '0',
      dislikesCount: '0',
      myStatus: likesStatuses.none,
      newestLikes: [],
    });
  }
  async updatePost(
    id: string,
    updateData: CreateAndUpdatePostModel,
  ): Promise<boolean> {
    const query = `UPDATE public."Posts"
            SET "title"=$1, "shortDescription"=$2, "content"=$3
            WHERE "id" = $4`;

    const resultUpdatePost = await this.dataSource.query(query, [
      updateData.title,
      updateData.shortDescription,
      updateData.content,
      id,
    ]);

    return resultUpdatePost[1] === 1;
  }
  async deletePost(id: string): Promise<boolean> {
    const query = `DELETE FROM public."Posts"
             WHERE "id" = $1`;

    const resultDeletePost = await this.dataSource.query(query, [id]);

    return resultDeletePost[1] === 1;
  }
}
