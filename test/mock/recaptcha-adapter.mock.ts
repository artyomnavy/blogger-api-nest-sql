import { RecaptchaAdapter } from '../../src/features/auth/adapters/recaptcha-adapter';

export class RecaptchaAdapterMock implements RecaptchaAdapter {
  verifyRecaptcha(token: string): Promise<boolean> {
    return Promise.resolve(true);
  }
}
