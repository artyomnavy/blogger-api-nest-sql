import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { CheckCredentialsCommand } from '../../application/use-cases/check-credentials-user.use-case';
import { CommandBus } from '@nestjs/cqrs';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly commandBus: CommandBus) {
    super({
      usernameField: 'loginOrEmail',
    });
  }

  async validate(loginOrEmail: string, password: string): Promise<any> {
    const user = await this.commandBus.execute(
      new CheckCredentialsCommand({
        loginOrEmail,
        password,
      }),
    );

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
