import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersQueryRepository } from '../../features/users/infrastructure/users.query-repository';

@Injectable()
export class RecoveryPasswordAuthGuard implements CanActivate {
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const recoveryCode = req.body.recoveryCode;
    const newPassword = req.body.newPassword;

    if (!recoveryCode || !newPassword) {
      throw new UnauthorizedException();
    }

    const isOldPassword =
      await this.usersQueryRepository.checkUserPasswordForRecovery(
        recoveryCode,
        newPassword,
      );

    if (isOldPassword) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
