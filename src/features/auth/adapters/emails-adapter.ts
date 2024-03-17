import nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailsAdapter {
  async sendEmailWithCode(email: string, code: string) {
    const transport = await nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_API,
        pass: process.env.EMAIL_API_PASSWORD,
      },
    });

    const info = await transport.sendMail({
      from: `Blogger Platform <${process.env.EMAIL_API}>`,
      to: email,
      subject: `Confirm registration account`,
      html: `<h1>Thanks for your registration</h1>
                <p>To finish registration please follow the link below:
                <a href='https://somesite.com/confirm-email?code=${code}'>complete registration</a>
                </p>`,
    });

    return info;
  }
  async sendEmailWithRecoveryCode(email: string, recoveryCode: string) {
    const transport = await nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_API,
        pass: process.env.EMAIL_API_PASSWORD,
      },
    });

    const info = await transport.sendMail({
      from: `Blogger Platform <${process.env.EMAIL_API}>`,
      to: email,
      subject: `Confirm password recovery`,
      html: `<h1>Password recovery</h1>
       <p>To finish password recovery please follow the link below:
          <a href='https://somesite.com/password-recovery?recoveryCode=${recoveryCode}'>recovery password</a>
      </p>`,
    });

    return info;
  }
}
