import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { BlogsQueryRepository } from '../../../features/blogs/infrastructure/blogs.query-repository';

@ValidatorConstraint({ name: 'IsBlogExist', async: true })
@Injectable()
export class BlogExistConstraint implements ValidatorConstraintInterface {
  constructor(private readonly blogsQueryRepository: BlogsQueryRepository) {}

  async validate(blogId: string): Promise<boolean> {
    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      return false;
    }

    return true;
  }
}

export function IsBlogExist(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: BlogExistConstraint,
    });
  };
}
