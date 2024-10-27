import { Injectable } from '@nestjs/common';
import { RecaptchaResponse } from '../api/models/auth.input.model';
import axios from 'axios';
import process from 'node:process';

@Injectable()
export class RecaptchaAdapter {
  async verifyRecaptcha(token: string): Promise<boolean> {
    const secretKey = process.env.RECAPTCHA_SECRET;

    const response = await axios.post<RecaptchaResponse>(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        params: {
          secret: secretKey,
          response: token,
        },
      },
    );

    if (!response.data.success || response.data.score < 0.9) {
      return false;
    }

    return true;
  }
}
