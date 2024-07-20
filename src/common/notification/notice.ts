export class Notice<T = null> {
  constructor(data: T | null = null) {
    this.data = data;
  }

  messages: { message: string; key?: string }[] = [];
  code = 0;
  data: T | null = null;

  public hasError(): boolean {
    return this.code !== 0;
  }

  public addError(
    code: number | null = null,
    message: string,
    key?: string,
  ): void {
    this.code = code ?? 1;
    this.messages.push({ message, key });
  }

  public addData(data: T) {
    this.data = data;
  }
}
