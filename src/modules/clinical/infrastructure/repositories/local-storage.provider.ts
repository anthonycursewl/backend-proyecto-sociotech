import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { StorageProvider, StoredFile } from '../../domain/ports/storage-provider.port';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  async upload(file: Buffer, fileName: string, mimeType: string): Promise<StoredFile> {
    const id = crypto.randomUUID();
    const ext = path.extname(fileName);
    const storedFileName = `${id}${ext}`;
    const filePath = path.join(this.uploadDir, storedFileName);

    await fs.writeFile(filePath, file);

    return {
      id,
      url: `/uploads/${storedFileName}`,
      key: storedFileName,
      mimeType,
      size: file.length,
      uploadedAt: new Date(),
    };
  }

  async delete(fileId: string): Promise<void> {
    const files = await fs.readdir(this.uploadDir);
    const file = files.find((f) => f.startsWith(fileId));

    if (file) {
      await fs.unlink(path.join(this.uploadDir, file));
    }
  }

  async getSignedUrl(fileId: string, expiresInSeconds: number = 3600): Promise<string> {
    return `/uploads/${fileId}?expires=${Date.now() + expiresInSeconds * 1000}`;
  }
}