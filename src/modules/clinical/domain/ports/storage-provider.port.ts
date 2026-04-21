export interface StorageProvider {
  upload(file: Buffer, fileName: string, mimeType: string): Promise<StoredFile>;
  delete(fileId: string): Promise<void>;
  getSignedUrl(fileId: string, expiresInSeconds?: number): Promise<string>;
}

export interface StoredFile {
  id: string;
  url: string;
  key: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}