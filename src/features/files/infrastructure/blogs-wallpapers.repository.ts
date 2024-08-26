import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BlogWallpaper } from '../domain/wallpaper-blog.entity';
import { EntityManager, Repository } from 'typeorm';
import { BlogWallpaperOutputModel } from '../api/models/blog-image.output.model';

@Injectable()
export class BlogsWallpapersRepository {
  constructor(
    @InjectRepository(BlogWallpaper)
    private readonly blogsWallpapersRepository: Repository<BlogWallpaper>,
  ) {}
  async uploadBlogWallpaper(
    wallpaper: BlogWallpaper,
    manager?: EntityManager,
  ): Promise<BlogWallpaperOutputModel> {
    const blogsWallpapersRepository = manager
      ? manager.getRepository(BlogWallpaper)
      : this.blogsWallpapersRepository;

    const blogWallpaper = new BlogWallpaper();

    blogWallpaper.id = wallpaper.id;
    blogWallpaper.url = wallpaper.url;
    blogWallpaper.width = wallpaper.width;
    blogWallpaper.height = wallpaper.height;
    blogWallpaper.fileSize = wallpaper.fileSize;
    blogWallpaper.blog = wallpaper.blog;

    const uploadBlogWallpaper =
      await blogsWallpapersRepository.save(blogWallpaper);

    return {
      url: uploadBlogWallpaper.url,
      width: uploadBlogWallpaper.width,
      height: uploadBlogWallpaper.height,
      fileSize: uploadBlogWallpaper.fileSize,
    };
  }
  async deleteBlogWallpaper(
    id: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const blogsWallpapersRepository = manager
      ? manager.getRepository(BlogWallpaper)
      : this.blogsWallpapersRepository;

    const resultDeleteBlogWallpaper =
      await blogsWallpapersRepository.delete(id);

    return resultDeleteBlogWallpaper.affected === 1;
  }
}
