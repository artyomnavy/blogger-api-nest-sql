import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersQueryRepository } from '../../features/users/infrastructure/users.query-repository';
import { JwtService } from '../../features/auth/application/jwt.service';
import { DevicesQueryRepository } from '../../features/devices/infrastrucure/devices.query-repository';

@Injectable()
export class RefreshTokenAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly devicesQueryRepository: DevicesQueryRepository,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) throw new UnauthorizedException();

    const payloadToken = await this.jwtService.checkToken(refreshToken);

    if (!payloadToken) throw new UnauthorizedException();

    req.userId = payloadToken.userId;
    req.deviceId = payloadToken.deviceId;

    const user = await this.usersQueryRepository.getUserById(
      payloadToken.userId,
    );

    if (!user) throw new UnauthorizedException();

    const deviceSession = await this.devicesQueryRepository.checkDeviceSession(
      payloadToken.userId,
      payloadToken.deviceId,
    );

    if (!deviceSession) throw new UnauthorizedException();

    const iatRefreshToken = new Date(payloadToken.iat * 1000);

    if (iatRefreshToken < deviceSession.iat) throw new UnauthorizedException();

    return true;
  }
}
