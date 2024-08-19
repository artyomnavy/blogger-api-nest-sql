import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAndUpdateBlogModel {
  @MaxLength(15, { message: 'Invalid name length' })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  name: string;

  @MaxLength(500, { message: 'Invalid description length' })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  description: string;

  @Matches(
    new RegExp(
      '^https://([a-zA-Z0-9_-]+.)+[a-zA-Z0-9_-]+(/[a-zA-Z0-9_-]+)*/?$',
    ),
    {
      message: 'Invalid websiteUrl pattern',
    },
  )
  @MaxLength(100, { message: 'Invalid websiteUrl length' })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  websiteUrl: string;
}
