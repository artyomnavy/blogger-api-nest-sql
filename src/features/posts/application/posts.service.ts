import { CreateAndUpdatePostModel } from '../api/models/post.input.model';
import { Post, PostOutputModel } from '../api/models/post.output.model';
import { BlogsQueryRepository } from '../../blogs/infrastructure/blogs.query-repository';
import { PostsRepository } from '../infrastructure/posts.repository';
import { ObjectId } from 'mongodb';
import { likesStatuses } from '../../../utils';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PostsService {
  constructor(
    protected postsRepository: PostsRepository,
    protected blogsQueryRepository: BlogsQueryRepository,
  ) {}
  async createPost(
    createData: CreateAndUpdatePostModel,
  ): Promise<PostOutputModel> {
    const blog = await this.blogsQueryRepository.getBlogById(
      createData.blogId!,
    );

    const newPost = new Post(
      new ObjectId(),
      createData.title,
      createData.shortDescription,
      createData.content,
      createData.blogId!,
      blog!.name,
      new Date(),
      {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: likesStatuses.none,
        newestLikes: [],
      },
    );

    const createdPost = await this.postsRepository.createPost(newPost);

    return createdPost;
  }
}
