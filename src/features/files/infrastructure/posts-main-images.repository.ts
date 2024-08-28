import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PostMainImage } from '../domain/main-image-post.entity';
import { PostMainImageOutputModel } from '../api/models/post-image.output.model';

@Injectable()
export class PostsMainImagesRepository {
  constructor(
    @InjectRepository(PostMainImage)
    private readonly postsMainImagesRepository: Repository<PostMainImage>,
  ) {}
  async uploadPostMainImage(
    mainImage: PostMainImage,
    manager?: EntityManager,
  ): Promise<PostMainImageOutputModel> {
    const postsMainImagesRepository = manager
      ? manager.getRepository(PostMainImage)
      : this.postsMainImagesRepository;

    const postMainImage = new PostMainImage();

    postMainImage.id = mainImage.id;
    postMainImage.url = mainImage.url;
    postMainImage.width = mainImage.width;
    postMainImage.height = mainImage.height;
    postMainImage.fileSize = mainImage.fileSize;
    postMainImage.imageSize = mainImage.imageSize;
    postMainImage.post = mainImage.post;

    const uploadPostMainImage =
      await postsMainImagesRepository.save(postMainImage);

    return {
      url: uploadPostMainImage.url,
      width: uploadPostMainImage.width,
      height: uploadPostMainImage.height,
      fileSize: uploadPostMainImage.fileSize,
    };
  }
}
