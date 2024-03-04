import { EmailsAdapter } from '../adapters/emails-adapter';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailsManager {
  constructor(protected emailsAdapter: EmailsAdapter) {}
  async sendEmailConfirmationMessage(email: string, code: string) {
    return await this.emailsAdapter.sendEmailWithCode(email, code);
  }
  async sendEmailReconfirmationMessage(email: string, recoveryCode: string) {
    return await this.emailsAdapter.sendEmailWithRecoveryCode(
      email,
      recoveryCode,
    );
  }
}
