import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';

export class CreateAndUpdateQuestionModel {
  @Length(10, 500)
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString({ each: true })
  @IsArray()
  correctAnswers: string[];
}

export class PublishQuestionModel {
  @IsBoolean()
  @IsNotEmpty()
  published: boolean;
}
