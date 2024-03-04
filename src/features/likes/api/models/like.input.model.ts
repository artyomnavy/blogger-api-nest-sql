import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateLikeModel {
  @IsIn(['None', 'Like', 'Dislike'])
  @MinLength(4)
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  likeStatus: string;
}
