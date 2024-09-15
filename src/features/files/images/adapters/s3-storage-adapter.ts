import { Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3StorageAdapter {
  s3Client: S3Client;
  constructor() {
    const region = process.env.S3_REGION;
    const endpoint = process.env.S3_ENDPOINT;
    const keyId = process.env.S3_KEY_ID;
    const secretKey = process.env.S3_SECRET_KEY;

    if (!region || !endpoint || !keyId || !secretKey) {
      throw new Error('S3 configuration is missing to env file');
    }

    this.s3Client = new S3Client({
      region: region,
      endpoint: endpoint,
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: secretKey,
      },
    });
  }

  async uploadImage(key: string, mimeType: string, buffer: Buffer) {
    const bucketParams = {
      Bucket: 'bloggerplatform',
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    };

    const command = new PutObjectCommand(bucketParams);

    try {
      const uploadImageResult = await this.s3Client.send(command);

      return uploadImageResult;
    } catch (exception) {
      console.error(exception);
      throw exception;
    }
  }
  async deleteImage(key: string) {
    const bucketName = process.env.S3_BUCKET_NAME;

    if (!bucketName) {
      throw new Error('Bucket name is missing to env file');
    }

    const bucketParams = {
      Bucket: bucketName,
      Key: key,
    };

    const command = new DeleteObjectCommand(bucketParams);

    try {
      const deleteImageResult = await this.s3Client.send(command);

      return deleteImageResult;
    } catch (exception) {
      console.error(exception);
      throw exception;
    }
  }
}
