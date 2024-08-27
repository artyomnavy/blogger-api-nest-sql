import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BlogMainImageOutputModel } from '../api/models/blog-image.output.model';
import { BlogMainImage } from '../domain/main-image-blog.entity';

@Injectable()
export class BlogsMainImagesRepository {
  constructor(
    @InjectRepository(BlogMainImage)
    private readonly blogsMainImagesRepository: Repository<BlogMainImage>,
  ) {}
  async uploadBlogMainImage(
    mainImage: BlogMainImage,
    manager?: EntityManager,
  ): Promise<BlogMainImageOutputModel> {
    const blogsMainImagesRepository = manager
      ? manager.getRepository(BlogMainImage)
      : this.blogsMainImagesRepository;

    const blogMainImage = new BlogMainImage();

    blogMainImage.id = mainImage.id;
    blogMainImage.url = mainImage.url;
    blogMainImage.width = mainImage.width;
    blogMainImage.height = mainImage.height;
    blogMainImage.fileSize = mainImage.fileSize;
    blogMainImage.blog = mainImage.blog;

    const uploadBlogWallpaper =
      await blogsMainImagesRepository.save(blogMainImage);

    return {
      url: uploadBlogWallpaper.url,
      width: uploadBlogWallpaper.width,
      height: uploadBlogWallpaper.height,
      fileSize: uploadBlogWallpaper.fileSize,
    };
  }
}
