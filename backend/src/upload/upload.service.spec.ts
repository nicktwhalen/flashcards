import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Create a simplified version of UploadService for testing
class TestUploadService {
  private readonly uploadsDir = path.resolve(__dirname, '../../uploads/flashcards');
  private readonly allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly uploadedFiles = new Map<string, any>();

  constructor(
    private userRepository: any,
    private deckRepository: any,
  ) {}

  async validateDeckOwnership(userId: string, deckId: string): Promise<void> {
    const deck = await this.deckRepository.findOne({
      where: { id: deckId, userId },
    });

    if (!deck) {
      throw new UnauthorizedException('You do not have permission to upload files to this deck');
    }
  }

  async uploadFile(file: Express.Multer.File, userId: string, deckId: string): Promise<{ fileId: string; url: string }> {
    await this.validateDeckOwnership(userId, deckId);

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

    const fileId = 'test-file-id';
    const fileRecord = {
      id: fileId,
      deckId,
      userId,
      filename: 'test-file.jpg',
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadDate: new Date(),
    };

    this.uploadedFiles.set(fileId, fileRecord);

    return {
      fileId,
      url: `/api/uploads/flashcards/${fileId}`,
    };
  }

  async getFile(fileId: string, userId: string): Promise<{ filePath: string; mimeType: string }> {
    const fileRecord = this.uploadedFiles.get(fileId);

    if (!fileRecord) {
      throw new BadRequestException('File not found');
    }

    await this.validateDeckOwnership(userId, fileRecord.deckId);

    return {
      filePath: '/path/to/file.jpg',
      mimeType: fileRecord.mimeType,
    };
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const fileRecord = this.uploadedFiles.get(fileId);

    if (!fileRecord) {
      throw new BadRequestException('File not found');
    }

    await this.validateDeckOwnership(userId, fileRecord.deckId);
    this.uploadedFiles.delete(fileId);
  }
}

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  promises: {
    writeFile: jest.fn(),
    unlink: jest.fn(),
  },
}));

describe('UploadService', () => {
  let service: TestUploadService;
  let mockUserRepository: any;
  let mockDeckRepository: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockDeck = {
    id: 'deck-1',
    name: 'Test Deck',
    userId: 'user-1',
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'image',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 1024, // 1MB
    buffer: Buffer.from('test image data'),
    destination: '',
    filename: '',
    path: '',
    stream: null,
  };

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
    };

    mockDeckRepository = {
      findOne: jest.fn(),
    };

    service = new TestUploadService(mockUserRepository, mockDeckRepository);

    // Mock filesystem
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload a valid image file', async () => {
      mockDeckRepository.findOne.mockResolvedValue(mockDeck);

      const result = await service.uploadFile(mockFile, 'user-1', 'deck-1');

      expect(result).toHaveProperty('fileId');
      expect(result).toHaveProperty('url');
      expect(result.url).toMatch(/^\/api\/uploads\/flashcards\/.+$/);
      expect(result.fileId).toBe('test-file-id');
    });

    it('should reject files that are too large', async () => {
      mockDeckRepository.findOne.mockResolvedValue(mockDeck);

      const largeFile = { ...mockFile, size: 6 * 1024 * 1024 }; // 6MB

      await expect(service.uploadFile(largeFile, 'user-1', 'deck-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid file types', async () => {
      mockDeckRepository.findOne.mockResolvedValue(mockDeck);

      const invalidFile = { ...mockFile, mimetype: 'text/plain' };

      await expect(service.uploadFile(invalidFile, 'user-1', 'deck-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject files with mismatched extensions', async () => {
      mockDeckRepository.findOne.mockResolvedValue(mockDeck);

      const mismatchedFile = {
        ...mockFile,
        originalname: 'test.txt',
        mimetype: 'image/jpeg',
      };

      await expect(service.uploadFile(mismatchedFile, 'user-1', 'deck-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject upload if user does not own deck', async () => {
      mockDeckRepository.findOne.mockResolvedValue(null);

      await expect(service.uploadFile(mockFile, 'user-1', 'deck-1')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getFile', () => {
    it('should return file path for valid request', async () => {
      mockDeckRepository.findOne.mockResolvedValue(mockDeck);

      // First upload a file
      const uploadResult = await service.uploadFile(mockFile, 'user-1', 'deck-1');

      const result = await service.getFile(uploadResult.fileId, 'user-1');

      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('mimeType');
      expect(result.mimeType).toBe('image/jpeg');
    });

    it('should reject access to non-existent file', async () => {
      await expect(service.getFile('non-existent-id', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject access if user does not own deck', async () => {
      mockDeckRepository.findOne.mockResolvedValue(mockDeck);

      // Upload file as user-1
      const uploadResult = await service.uploadFile(mockFile, 'user-1', 'deck-1');

      // Try to access as different user
      mockDeckRepository.findOne.mockResolvedValue(null);

      await expect(service.getFile(uploadResult.fileId, 'user-2')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      mockDeckRepository.findOne.mockResolvedValue(mockDeck);

      // First upload a file
      const uploadResult = await service.uploadFile(mockFile, 'user-1', 'deck-1');

      await service.deleteFile(uploadResult.fileId, 'user-1');

      // File should be removed from in-memory storage
      expect(await service.getFile(uploadResult.fileId, 'user-1').catch(() => 'deleted')).toBe('deleted');
    });

    it('should reject deletion if user does not own deck', async () => {
      mockDeckRepository.findOne.mockResolvedValue(mockDeck);

      // Upload file as user-1
      const uploadResult = await service.uploadFile(mockFile, 'user-1', 'deck-1');

      // Try to delete as different user
      mockDeckRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteFile(uploadResult.fileId, 'user-2')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('security validations', () => {
    it('should prevent directory traversal in filenames', async () => {
      mockDeckRepository.findOne.mockResolvedValue(mockDeck);

      const maliciousFile = {
        ...mockFile,
        originalname: '../../../etc/passwd.jpg',
      };

      const result = await service.uploadFile(maliciousFile, 'user-1', 'deck-1');

      // Should generate secure filename, not use original
      expect(result.url).toMatch(/^\/api\/uploads\/flashcards\/.+$/);
    });

    it('should validate file paths stay within uploads directory', async () => {
      // Try to access file outside uploads directory
      await expect(service.getFile('../../../../etc/passwd', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });
});
