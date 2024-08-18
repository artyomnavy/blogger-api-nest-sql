import { FileValidator, Injectable } from '@nestjs/common';
import sharp from 'sharp';

type ImageSize = {
  width: number;
  height: number;
};

@Injectable()
export class ImageSizeFileValidator extends FileValidator<ImageSize> {
  constructor(
    protected width: number,
    protected height: number,
  ) {
    super({ width, height });
  }

  async isValid(file: Express.Multer.File): Promise<boolean> {
    try {
      const metadata = await sharp(file.buffer).metadata();
      const { width, height } = metadata;

      return (
        width === this.validationOptions.width &&
        height === this.validationOptions.height
      );
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  buildErrorMessage(): string {
    return `Invalid image width and/or height`;
  }
}
