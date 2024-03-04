import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from '../domain/blog.entity';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import {
  blogMapper,
  BlogModel,
  BlogOutputModel,
} from '../api/models/blog.output.model';
import { CreateAndUpdateBlogModel } from '../api/models/blog.input.model';

@Injectable()
export class BlogsRepository {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>) {}
  async createBlog(newBlog: BlogModel): Promise<BlogOutputModel> {
    const resultCreateBlog = await this.blogModel.create(newBlog);
    return blogMapper(resultCreateBlog);
  }
  async updateBlog(
    id: string,
    updateData: CreateAndUpdateBlogModel,
  ): Promise<boolean> {
    const resultUpdateBlog = await this.blogModel.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: updateData.name,
          description: updateData.description,
          websiteUrl: updateData.websiteUrl,
        },
      },
    );
    return resultUpdateBlog.matchedCount === 1;
  }
  async deleteBlog(id: string): Promise<boolean> {
    const resultDeleteBlog = await this.blogModel.deleteOne({
      _id: new ObjectId(id),
    });
    return resultDeleteBlog.deletedCount === 1;
  }
}
