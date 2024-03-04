import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtBearerAuthGuard extends AuthGuard('jwt') {}
