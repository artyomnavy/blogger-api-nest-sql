import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { PostsQueryRepository } from '../../features/posts/infrastructure/posts.query-repository';

@Injectable()
export class PostExistsPipe implements PipeTransform {
  constructor(private readonly postsQueryRepository: PostsQueryRepository) {}
  async transform(postId: string) {
    const post = await this.postsQueryRepository.getPostById(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return postId;
  }
}
