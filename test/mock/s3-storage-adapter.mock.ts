import { S3StorageAdapter } from '../../src/features/files/images/adapters/s3-storage-adapter';
import {
  DeleteObjectCommandOutput,
  PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';

export class S3StorageAdapterMock implements S3StorageAdapter {
  s3Client: S3Client;
  constructor() {
    this.s3Client = new S3Client({});
  }
  uploadImage(
    key: string,
    mimeType: string,
    buffer: Buffer,
  ): Promise<PutObjectCommandOutput> {
    return Promise.resolve({
      $metadata: {},
    });
  }

  deleteImage(key: string): Promise<DeleteObjectCommandOutput> {
    return Promise.resolve({
      $metadata: {},
    });
  }
}
