import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsBlogExist } from '../../../../common/decorators/validators/blog-validator.decorator';

export class CreateAndUpdatePostModel {
  @MaxLength(30, { message: 'Invalid title length' })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  title: string;

  @MaxLength(100, { message: 'Invalid shortDescription length' })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  shortDescription: string;

  @MaxLength(1000, { message: 'Invalid content length' })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsBlogExist({ message: 'Blog is not exist' })
  @IsMongoId()
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  blogId?: string;
}
