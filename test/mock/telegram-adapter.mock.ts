import { TelegramAdapter } from '../../src/features/integrations/telegram/adapters/telegram.adapter';

export class TelegramAdapterMock extends TelegramAdapter {
  constructor() {
    super();
  }

  sendMessage(text: string, recipientId: number): Promise<void> {
    return Promise.resolve();
  }

  setWebhook(url: string): Promise<void> {
    return Promise.resolve();
  }
}
