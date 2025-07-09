import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { Response } from 'express';

describe('UploadController', () => {
  let controller: UploadController;
  let uploadService: UploadService;

  const mockUploadService = {
    uploadFile: jest.fn(),
    getFile: jest.fn(),
    getFilePublic: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'image',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 1024,
    buffer: Buffer.from('test image data'),
    destination: '',
    filename: '',
    path: '',
    stream: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
    uploadService = module.get<UploadService>(UploadService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFlashcardImage', () => {
    it('should upload image successfully', async () => {
      const expectedResult = {
        fileId: 'test-file-id',
        url: '/api/uploads/flashcards/test-file-id',
      };

      mockUploadService.uploadFile.mockResolvedValue(expectedResult);

      const mockRequest = { user: mockUser } as any;
      const result = await controller.uploadFlashcardImage('deck-1', mockFile, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockUploadService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        mockUser.id,
        'deck-1'
      );
    });

    it('should throw BadRequestException when no file is uploaded', async () => {
      const mockRequest = { user: mockUser } as any;

      await expect(controller.uploadFlashcardImage('deck-1', undefined, mockRequest))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should propagate service errors', async () => {
      mockUploadService.uploadFile.mockRejectedValue(new Error('Upload failed'));

      const mockRequest = { user: mockUser } as any;

      await expect(controller.uploadFlashcardImage('deck-1', mockFile, mockRequest))
        .rejects
        .toThrow('Upload failed');
    });
  });

  describe('getFlashcardImage', () => {
    it('should serve image file successfully', async () => {
      const mockFileData = {
        filePath: '/path/to/file.jpg',
        mimeType: 'image/jpeg',
      };

      mockUploadService.getFilePublic.mockResolvedValue(mockFileData);
      const mockResponse = {
        setHeader: jest.fn(),
        sendFile: jest.fn(),
      } as unknown as Response;

      await controller.getFlashcardImage('file-id', mockResponse);

      expect(mockUploadService.getFilePublic).toHaveBeenCalledWith('file-id');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600');
      expect(mockResponse.sendFile).toHaveBeenCalledWith('/path/to/file.jpg');
    });

    it('should propagate service errors', async () => {
      mockUploadService.getFilePublic.mockRejectedValue(new Error('File not found'));

      const mockResponse = {} as Response;

      await expect(controller.getFlashcardImage('file-id', mockResponse))
        .rejects
        .toThrow('File not found');
    });
  });

  describe('deleteFlashcardImage', () => {
    it('should delete image successfully', async () => {
      mockUploadService.deleteFile.mockResolvedValue(undefined);

      const mockRequest = { user: mockUser } as any;
      const result = await controller.deleteFlashcardImage('file-id', mockRequest);

      expect(result).toEqual({ message: 'File deleted successfully' });
      expect(mockUploadService.deleteFile).toHaveBeenCalledWith('file-id', mockUser.id);
    });

    it('should propagate service errors', async () => {
      mockUploadService.deleteFile.mockRejectedValue(new Error('Delete failed'));

      const mockRequest = { user: mockUser } as any;

      await expect(controller.deleteFlashcardImage('file-id', mockRequest))
        .rejects
        .toThrow('Delete failed');
    });
  });
});