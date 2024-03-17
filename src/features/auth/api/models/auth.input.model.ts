import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import {
  CheckCodeConfirmation,
  CheckRecoveryCodeConfirmation,
  IsEmailExistAndConfirmed,
} from '../../../../common/decorators/validators/user-validator.decorator';

export class AuthLoginModel {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  loginOrEmail: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  @IsNotEmpty()
  password: string;
}

export class PasswordRecoveryModel {
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
    message: 'Invalid email pattern',
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  email: string;
}

export class NewPasswordRecoveryModel {
  @CheckRecoveryCodeConfirmation({
    message: 'Recovery code is not exist or expired',
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  recoveryCode: string;

  @Length(6, 20)
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

export class ConfirmCodeModel {
  @CheckCodeConfirmation({
    message: 'Code is not exist or already been applied or expired',
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class RegistrationEmailResendModel {
  @IsEmailExistAndConfirmed({ message: 'Email is not exist or confirmed' })
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
    message: 'Invalid email pattern',
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  email: string;
}
