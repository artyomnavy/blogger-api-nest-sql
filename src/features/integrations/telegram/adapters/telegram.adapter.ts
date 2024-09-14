import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class TelegramAdapter {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/`,
    });
  }

  async sendMessage(text: string, recepientId: number) {
    await this.axiosInstance.post(`sendMessage`, {
      chat_id: recepientId,
      text: text,
    });
  }

  async setWebhook(url: string) {
    await this.axiosInstance.post(`setWebhook`, {
      url: url,
    });
  }
}
