import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

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
}
