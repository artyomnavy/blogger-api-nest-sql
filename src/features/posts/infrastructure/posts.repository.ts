import { Injectable } from '@nestjs/common';
import { PostModel, PostOutputModel } from '../api/models/post.output.model';
import { CreateAndUpdatePostModel } from '../api/models/post.input.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from '../domain/post.entity';
import { ObjectId } from 'mongodb';
import { PostsQueryRepository } from './posts.query-repository';

@Injectable()
export class PostsRepository {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    protected postsQueryRepository: PostsQueryRepository,
  ) {}
  async createPost(newPost: PostModel): Promise<PostOutputModel> {
    const resultCreatePost = await this.postModel.create(newPost);
    return await this.postsQueryRepository.postMapper(resultCreatePost);
  }
  async updatePost(
    id: string,
    updateData: CreateAndUpdatePostModel,
  ): Promise<boolean> {
    const resultUpdatePost = await this.postModel.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title: updateData.title,
          shortDescription: updateData.shortDescription,
          content: updateData.content,
          blogId: updateData.blogId,
        },
      },
    );
    return resultUpdatePost.matchedCount === 1;
  }
  async changeLikeStatusPostForUser(
    postId: string,
    likesCount: number,
    dislikesCount: number,
  ): Promise<boolean> {
    const resultUpdateLikeStatus = await this.postModel.updateOne(
      {
        _id: new ObjectId(postId),
      },
      {
        $set: {
          'extendedLikesInfo.likesCount': likesCount,
          'extendedLikesInfo.dislikesCount': dislikesCount,
        },
      },
    );
    return resultUpdateLikeStatus.matchedCount === 1;
  }
  async deletePost(id: string): Promise<boolean> {
    const resultDeletePost = await this.postModel.deleteOne({
      _id: new ObjectId(id),
    });
    return resultDeletePost.deletedCount === 1;
  }
}
