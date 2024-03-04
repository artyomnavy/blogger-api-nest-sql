import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument } from '../domain/blog.entity';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { blogMapper, BlogOutputModel } from '../api/models/blog.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectModel(Blog.name) private blogModel: Model<BlogDocument>) {}
  async getAllBlogs(
    queryData: PaginatorModel,
  ): Promise<PaginatorOutputModel<BlogOutputModel>> {
    const searchNameTerm = queryData.searchNameTerm
      ? queryData.searchNameTerm
      : null;
    const sortBy = queryData.sortBy ? queryData.sortBy : 'createdAt';
    const sortDirection = queryData.sortDirection
      ? queryData.sortDirection
      : 'desc';
    const pageNumber = queryData.pageNumber ? queryData.pageNumber : 1;
    const pageSize = queryData.pageSize ? queryData.pageSize : 10;

    let filter = {};

    if (searchNameTerm) {
      filter = {
        name: {
          $regex: searchNameTerm,
          $options: 'i',
        },
      };
    }

    const blogs = await this.blogModel
      .find(filter)
      .sort({
        [sortBy]: sortDirection === 'desc' ? -1 : 1,
      })
      .skip((+pageNumber - 1) * +pageSize)
      .limit(+pageSize);

    const totalCount = await this.blogModel.countDocuments(filter);

    const pagesCount = Math.ceil(+totalCount / +pageSize);

    return {
      pagesCount: pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: +totalCount,
      items: blogs.map(blogMapper),
    };
  }
  async getBlogById(id: string): Promise<BlogOutputModel | null> {
    const blog = await this.blogModel.findOne({ _id: new ObjectId(id) });

    if (!blog) {
      return null;
    } else {
      return blogMapper(blog);
    }
  }
}
