import { Injectable } from '@nestjs/common';
import { join } from 'node:path';
import { deleteFileAsync, ensureDirAsync, saveFileAsync } from '../fs-utils';

@Injectable()
export class FilesStorageAdapter {
  async uploadBlogWallpaper(
    blogId: string,
    originalName: string,
    buffer: Buffer,
  ): Promise<string> {
    const dirPath = join('views', 'blogs', `${blogId}`, 'wallpapers');

    await ensureDirAsync(dirPath);

    const relativePath = join(dirPath, originalName);

    await saveFileAsync(relativePath, buffer);

    return relativePath.replace(/\\/g, '/');
  }
  async deleteBlogWallpaper(url: string) {
    await deleteFileAsync(url);
  }
}
