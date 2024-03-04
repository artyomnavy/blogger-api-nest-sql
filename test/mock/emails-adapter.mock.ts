import { EmailsAdapter } from '../../src/adapters/emails-adapter';
import { SentMessageInfo } from 'nodemailer';

export class EmailsAdapterMock implements EmailsAdapter {
  sendEmailWithCode(email: string, code: string): Promise<SentMessageInfo> {
    return Promise.resolve({});
  }

  sendEmailWithRecoveryCode(
    email: string,
    recoveryCode: string,
  ): Promise<SentMessageInfo> {
    return Promise.resolve({});
  }
}
