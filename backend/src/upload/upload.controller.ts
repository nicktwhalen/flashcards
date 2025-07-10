import { Controller, Post, Get, Delete, Param, UseGuards, UseInterceptors, UploadedFile, Req, Res, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { UploadService } from './upload.service';
import { User } from '../entities/user.entity';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('flashcards/:deckId')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('image'))
  async uploadFlashcardImage(@Param('deckId') deckId: string, @UploadedFile() file: Express.Multer.File, @Req() req: Request): Promise<{ fileId: string; url: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const user = req.user as User;
    return this.uploadService.uploadFile(file, user.id, deckId);
  }

  @Get('flashcards/:fileId')
  async getFlashcardImage(@Param('fileId') fileId: string, @Res() res: Response): Promise<void> {
    const { filePath, mimeType } = await this.uploadService.getFilePublic(fileId);

    // Set security headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Send file
    res.sendFile(filePath);
  }

  @Delete('flashcards/:fileId')
  @UseGuards(AuthGuard('jwt'))
  async deleteFlashcardImage(@Param('fileId') fileId: string, @Req() req: Request): Promise<{ message: string }> {
    const user = req.user as User;
    await this.uploadService.deleteFile(fileId, user.id);
    return { message: 'File deleted successfully' };
  }
}
