import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  IsEmailExist,
  IsLoginExist,
} from '../../../../common/decorators/validators/user-validator.decorator';

export class CreateUserModel {
  @IsLoginExist({ message: 'Login already exist' })
  @Matches(/^[a-zA-Z0-9_-]*$/, {
    message: 'Invalid login pattern',
  })
  @Length(3, 10, { message: 'Invalid login length' })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  login: string;

  @Length(6, 20, { message: 'Invalid password length' })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEmailExist({ message: 'Email already exist' })
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
    message: 'Invalid email pattern',
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  email: string;
}
