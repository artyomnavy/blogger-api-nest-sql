import { Injectable } from '@nestjs/common';
import { join } from 'node:path';
import { deleteFileAsync, ensureDirAsync, saveFileAsync } from '../fs-utils';

@Injectable()
export class FilesStorageAdapter {
  async uploadImage(
    dirPath: string,
    originalName: string,
    buffer: Buffer,
  ): Promise<string> {
    await ensureDirAsync(dirPath);

    const relativePath = join(dirPath, originalName);

    await saveFileAsync(relativePath, buffer);

    return relativePath.replace(/\\/g, '/');
  }
  async deleteImage(url: string) {
    await deleteFileAsync(url);
  }
}
