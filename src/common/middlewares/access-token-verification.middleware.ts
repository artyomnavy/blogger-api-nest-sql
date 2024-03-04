import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from '../../application/jwt.service';
import { UsersQueryRepository } from '../../features/superadmin/users/infrastructure/users.query-repository';

@Injectable()
export class AccessTokenVerificationMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const auth = req.headers.authorization;

    if (!auth || auth.split(' ')[0] !== 'Bearer') {
      req.userId = null;
      next();
      return;
    }

    const accessToken = auth.split(' ')[1];

    const payloadToken = await this.jwtService.checkToken(accessToken);

    if (!payloadToken) {
      throw new UnauthorizedException();
    }

    const user = await this.usersQueryRepository.getUserById(
      payloadToken.userId,
    );

    if (!user) {
      throw new UnauthorizedException();
    }

    req.userId = payloadToken.userId;
    next();
  }
}
