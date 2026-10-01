import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env';

export interface StoredFile {
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export class LocalStorageService {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = path.resolve(baseDir ?? env.UPLOAD_DIR);
  }

  private async ensureDir(subDir: string): Promise<string> {
    const dir = path.join(this.baseDir, subDir);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  private sanitiseFilename(original: string): string {
    // Strip path separators and dangerous characters
    return path.basename(original).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
  }

  async saveTicketAttachment(
    file: Express.Multer.File,
    ticketId: string,
  ): Promise<StoredFile> {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed for ticket attachments.`);
    }

    const dir = await this.ensureDir(`tickets/${ticketId}`);
    const safe = this.sanitiseFilename(file.originalname);
    const storedFilename = `${crypto.randomUUID()}-${safe}`;
    const storagePath = path.join(dir, storedFilename);

    await fs.writeFile(storagePath, file.buffer);

    return {
      originalFilename: file.originalname,
      storedFilename,
      mimeType: file.mimetype,
      fileSize: file.size,
      storagePath,
    };
  }

  async savePaymentReceipt(
    file: Express.Multer.File,
    applicationId: string,
  ): Promise<StoredFile> {
    if (!ALLOWED_RECEIPT_TYPES.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed for payment receipts.`);
    }

    const dir = await this.ensureDir(`receipts/${applicationId}`);
    const safe = this.sanitiseFilename(file.originalname);
    const storedFilename = `${crypto.randomUUID()}-${safe}`;
    const storagePath = path.join(dir, storedFilename);

    await fs.writeFile(storagePath, file.buffer);

    return {
      originalFilename: file.originalname,
      storedFilename,
      mimeType: file.mimetype,
      fileSize: file.size,
      storagePath,
    };
  }

  async readFile(storagePath: string): Promise<Buffer> {
    // Prevent path traversal
    const resolved = path.resolve(storagePath);
    const base = path.resolve(this.baseDir);
    if (!resolved.startsWith(base)) {
      throw new Error('Access denied.');
    }
    return fs.readFile(resolved);
  }

  async deleteFile(storagePath: string): Promise<void> {
    const resolved = path.resolve(storagePath);
    const base = path.resolve(this.baseDir);
    if (!resolved.startsWith(base)) {
      throw new Error('Access denied.');
    }
    await fs.unlink(resolved).catch(() => {});
  }
}

export const storageService = new LocalStorageService();
