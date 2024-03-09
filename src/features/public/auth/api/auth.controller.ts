import { UsersQueryRepository } from '../../../superadmin/users/infrastructure/users.query-repository';
import {
  Controller,
  HttpCode,
  Post,
  Body,
  Req,
  UseGuards,
  Res,
  HttpException,
  Get,
} from '@nestjs/common';
import { HTTP_STATUSES } from '../../../../utils';
import {
  AuthLoginModel,
  ConfirmCodeModel,
  RegistrationEmailResendModel,
  NewPasswordRecoveryModel,
  PasswordRecoveryModel,
} from './models/auth.input.model';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RecoveryPasswordAuthGuard } from '../../../../common/guards/recovery-password-auth.guard';
import { RefreshTokenAuthGuard } from '../../../../common/guards/refresh-token-auth.guard';
import { CreateUserModel } from '../../../superadmin/users/api/models/user.input.model';
import { LocalAuthGuard } from '../../../../common/guards/local-auth.gurad';
import { JwtBearerAuthGuard } from '../../../../common/guards/jwt-bearer-auth-guard.service';
import { CurrentUserId } from '../../../../common/decorators/current-user-id.param.decorator';
import { CommandBus } from '@nestjs/cqrs';
import { TerminateDeviceSessionByLogoutCommand } from '../../devices/application/use-cases/terminate-device-by-logout.use-case';
import { UpdateDeviceSessionCommand } from '../../devices/application/use-cases/update-device.use-case';
import { CreateDeviceSessionCommand } from '../../devices/application/use-cases/create-device.use-case';
import { CreateUserByRegistrationCommand } from '../application/use-cases/create-user-by-registration.use-case';
import { ConfirmEmailCommand } from '../application/use-cases/confirm-email-user.use-case';
import { ResendingEmailCommand } from '../application/use-cases/re-sending-email-user.use-case';
import { UpdatePasswordForRecoveryCommand } from '../application/use-cases/update-password-for-recovery-user.use-case';
import { SendEmailForPasswordRecoveryCommand } from '../application/use-cases/send-email-for-password-recovery-user.use-case';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    protected usersQueryRepository: UsersQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Post('login')
  @UseGuards(ThrottlerGuard, LocalAuthGuard)
  @HttpCode(HTTP_STATUSES.OK_200)
  async loginUser(
    @Body() authModel: AuthLoginModel,
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceId = uuidv4();
    const ip = req.ip! || 'unknown';
    const deviceName = req.headers['user-agent'] || 'unknown';
    const userId = req.user.id;

    const deviceSession = await this.commandBus.execute(
      new CreateDeviceSessionCommand(deviceId, ip, deviceName, userId),
    );

    if (deviceSession) {
      res.cookie('refreshToken', deviceSession.refreshToken, {
        httpOnly: true,
        secure: true,
      });
      return { accessToken: deviceSession.accessToken };
    }
  }

  @Post('password-recovery')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async sendEmailForRecoveryPassword(
    @Body() recoveryModel: PasswordRecoveryModel,
  ) {
    const user = await this.usersQueryRepository.getUserByEmail(
      recoveryModel.email,
    );

    if (!user) return;

    const isSend = await this.commandBus.execute(
      new SendEmailForPasswordRecoveryCommand(recoveryModel.email),
    );

    if (!isSend) {
      throw new HttpException(
        "Recovery code don't sending to passed email address, try later",
        HTTP_STATUSES.IM_A_TEAPOT_418,
      );
    }

    return;
  }

  @Post('new-password')
  @UseGuards(ThrottlerGuard, RecoveryPasswordAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async changePasswordForRecovery(
    @Body() recoveryModel: NewPasswordRecoveryModel,
  ) {
    const isUpdate = await this.commandBus.execute(
      new UpdatePasswordForRecoveryCommand(
        recoveryModel.recoveryCode,
        recoveryModel.newPassword,
      ),
    );

    if (isUpdate) return;
  }

  @Post('refresh-token')
  @UseGuards(RefreshTokenAuthGuard)
  @HttpCode(HTTP_STATUSES.OK_200)
  async getNewPairTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.userId!;
    const deviceId = req.deviceId!;
    const newIp = req.ip! || 'unknown';
    const newDeviceName = req.headers['user-agent'] || 'unknown';

    const newDeviceSession = await this.commandBus.execute(
      new UpdateDeviceSessionCommand(userId, deviceId, newIp, newDeviceName),
    );

    if (newDeviceSession) {
      res.cookie('refreshToken', newDeviceSession.newRefreshToken, {
        httpOnly: true,
        secure: true,
      });
      return { accessToken: newDeviceSession.newAccessToken };
    }
  }
  @Post('logout')
  @UseGuards(RefreshTokenAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async logoutUser(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.userId!;
    const deviceId = req.deviceId!;

    const isTerminateDeviceSession = await this.commandBus.execute(
      new TerminateDeviceSessionByLogoutCommand(deviceId, userId),
    );

    if (isTerminateDeviceSession) {
      res.clearCookie('refreshToken');
      return;
    }
  }
  @Post('registration')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async createUserByRegistration(@Body() createModel: CreateUserModel) {
    const user = await this.commandBus.execute(
      new CreateUserByRegistrationCommand(createModel),
    );

    if (!user)
      throw new HttpException(
        "Recovery code don't sending to passed email address, try later",
        HTTP_STATUSES.IM_A_TEAPOT_418,
      );

    return;
  }
  @Post('registration-confirmation')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async sendEmailForConfirmRegistration(
    @Body() confirmModel: ConfirmCodeModel,
  ) {
    await this.commandBus.execute(new ConfirmEmailCommand(confirmModel.code));

    return;
  }
  @Post('registration-email-resending')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async resendEmailForConfirmRegistration(
    @Body() confirmModel: RegistrationEmailResendModel,
  ) {
    const isResend = await this.commandBus.execute(
      new ResendingEmailCommand(confirmModel.email),
    );

    if (!isResend)
      throw new HttpException(
        "Recovery code don't sending to passed email address, try later",
        HTTP_STATUSES.IM_A_TEAPOT_418,
      );

    return;
  }
  @Get('me')
  @UseGuards(JwtBearerAuthGuard)
  async getInfoAboutSelf(@CurrentUserId() currentUserId: string) {
    const authMe =
      await this.usersQueryRepository.getUserByIdForAuthMe(currentUserId);

    return authMe;
  }
}
