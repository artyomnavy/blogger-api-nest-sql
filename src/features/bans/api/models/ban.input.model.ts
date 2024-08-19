import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserBanByAdminModel {
  @IsBoolean()
  @IsNotEmpty()
  isBanned: boolean;

  @MinLength(20, { message: 'Invalid banReason length' })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  banReason: string;
}

export class UpdateUserBanByBloggerModel {
  @IsBoolean()
  @IsNotEmpty()
  isBanned: boolean;

  @MinLength(20, { message: 'Invalid banReason length' })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  banReason: string;

  @IsUUID('4', { message: 'Invalid blogId value' })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  blogId: string;
}

export class UpdateBlogBanByAdminModel {
  @IsBoolean()
  @IsNotEmpty()
  isBanned: boolean;
}
