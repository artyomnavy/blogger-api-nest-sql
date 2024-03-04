import jwt from 'jsonwebtoken';
import { Injectable } from '@nestjs/common';
import { jwtSecret } from '../features/public/auth/api/auth.constants';

@Injectable()
export class JwtService {
  async createAccessJWT(userId: string) {
    const accessToken = jwt.sign({ userId }, jwtSecret, { expiresIn: '10s' });
    return accessToken;
  }
  async createRefreshJWT(deviceId: string, userId: string) {
    const refreshToken = jwt.sign({ deviceId, userId }, jwtSecret, {
      expiresIn: '20s',
    });
    return refreshToken;
  }
  async checkToken(token: string) {
    try {
      const decodedToken: any = jwt.verify(token, jwtSecret);
      return decodedToken;
    } catch (error) {
      return null;
    }
  }
  async getPayloadByToken(token: string) {
    try {
      const decodedToken: any = jwt.decode(token);
      return decodedToken;
    } catch (error) {
      return null;
    }
  }
}
