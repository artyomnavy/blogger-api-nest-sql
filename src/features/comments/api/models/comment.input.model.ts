import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateAndUpdateCommentModel {
  @Length(20, 300)
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  content: string;
}
