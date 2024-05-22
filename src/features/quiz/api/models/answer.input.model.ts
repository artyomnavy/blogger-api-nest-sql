import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAnswerModel {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  answer: string;
}
