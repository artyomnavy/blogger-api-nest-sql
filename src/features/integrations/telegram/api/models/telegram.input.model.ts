export type TelegramMessageModel = {
  message: {
    from: { id: number };
    text: string;
  };
};
