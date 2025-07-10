import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Deck } from '../entities/deck.entity';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

interface FileUpload {
  id: string;
  deckId: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadDate: Date;
}

@Injectable()
export class UploadService {
  private readonly uploadsDir = path.resolve(__dirname, '../../uploads/flashcards');
  private readonly allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly uploadedFiles = new Map<string, FileUpload>(); // In production, use database

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Deck)
    private deckRepository: Repository<Deck>,
  ) {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Validates file security and returns safe filename
   */
  private async validateFile(file: Express.Multer.File): Promise<string> {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only images are allowed.');
    }

    // Validate file extension matches MIME type
    const ext = path.extname(file.originalname).toLowerCase();
    const validExtensions = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    };

    if (!validExtensions[file.mimetype]?.includes(ext)) {
      throw new BadRequestException('File extension does not match MIME type');
    }

    // Generate secure filename using UUID
    const fileId = crypto.randomUUID();
    const secureFilename = `${fileId}${ext}`;

    return secureFilename;
  }

  /**
   * Validates file security and returns safe filename using provided fileId
   */
  private async validateFileWithId(file: Express.Multer.File, fileId: string): Promise<string> {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only images are allowed.');
    }

    // Validate file extension matches MIME type
    const ext = path.extname(file.originalname).toLowerCase();
    const validExtensions = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    };

    if (!validExtensions[file.mimetype]?.includes(ext)) {
      throw new BadRequestException('File extension does not match MIME type');
    }

    // Generate secure filename using provided fileId
    const secureFilename = `${fileId}${ext}`;

    return secureFilename;
  }

  /**
   * Validates that user owns the deck
   */
  private async validateDeckOwnership(userId: string, deckId: string): Promise<void> {
    const deck = await this.deckRepository.findOne({
      where: { id: deckId, userId },
    });

    if (!deck) {
      throw new UnauthorizedException('You do not have permission to upload files to this deck');
    }
  }

  /**
   * Validates and normalizes file path to prevent directory traversal
   */
  private validateFilePath(filename: string): string {
    // Remove any directory traversal attempts
    const sanitized = path.basename(filename);
    const fullPath = path.resolve(this.uploadsDir, sanitized);

    // Ensure the resolved path is within the uploads directory
    if (!fullPath.startsWith(this.uploadsDir)) {
      throw new BadRequestException('Invalid file path');
    }

    return fullPath;
  }

  /**
   * Uploads a file securely
   */
  async uploadFile(file: Express.Multer.File, userId: string, deckId: string): Promise<{ fileId: string; url: string }> {
    // Validate deck ownership
    await this.validateDeckOwnership(userId, deckId);

    // Generate unique file ID first
    const fileId = crypto.randomUUID();

    // Validate file and get secure filename using the fileId
    const ext = path.extname(file.originalname).toLowerCase();
    const secureFilename = await this.validateFileWithId(file, fileId);

    // Get safe file path
    const filePath = this.validateFilePath(secureFilename);

    // Save file
    await fs.promises.writeFile(filePath, file.buffer);

    // Store file metadata (in production, store in database)
    const fileRecord: FileUpload = {
      id: fileId,
      deckId,
      userId,
      filename: secureFilename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadDate: new Date(),
    };

    this.uploadedFiles.set(fileId, fileRecord);

    // Return file ID and URL
    return {
      fileId,
      url: `/uploads/flashcards/${fileId}`,
    };
  }

  /**
   * Serves a file securely with authentication
   */
  async getFile(fileId: string, userId: string): Promise<{ filePath: string; mimeType: string }> {
    const fileRecord = this.uploadedFiles.get(fileId);

    if (!fileRecord) {
      throw new BadRequestException('File not found');
    }

    // Validate that user owns the deck this file belongs to
    await this.validateDeckOwnership(userId, fileRecord.deckId);

    // Get secure file path
    const filePath = this.validateFilePath(fileRecord.filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File not found on disk');
    }

    return {
      filePath,
      mimeType: fileRecord.mimeType,
    };
  }

  /**
   * Serves a file publicly (no authentication required)
   * Security is maintained through obscure file IDs
   */
  async getFilePublic(fileId: string): Promise<{ filePath: string; mimeType: string }> {
    const fileRecord = this.uploadedFiles.get(fileId);

    if (!fileRecord) {
      // Fallback: try to find file on disk by fileId (for legacy files)
      const possibleExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      for (const ext of possibleExtensions) {
        const filename = `${fileId}${ext}`;
        const filePath = this.validateFilePath(filename);
        if (fs.existsSync(filePath)) {
          // Determine MIME type from extension
          const mimeTypeMap = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
          };
          return {
            filePath,
            mimeType: mimeTypeMap[ext] || 'application/octet-stream',
          };
        }
      }
      throw new BadRequestException('File not found');
    }

    // Get secure file path
    const filePath = this.validateFilePath(fileRecord.filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File not found on disk');
    }

    return {
      filePath,
      mimeType: fileRecord.mimeType,
    };
  }

  /**
   * Deletes a file securely
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    const fileRecord = this.uploadedFiles.get(fileId);

    if (!fileRecord) {
      throw new BadRequestException('File not found');
    }

    // Validate that user owns the deck this file belongs to
    await this.validateDeckOwnership(userId, fileRecord.deckId);

    // Get secure file path
    const filePath = this.validateFilePath(fileRecord.filename);

    // Delete file from disk
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }

    // Remove from records
    this.uploadedFiles.delete(fileId);
  }
}
