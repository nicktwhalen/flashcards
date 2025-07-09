import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deck, Flashcard } from '../entities';
import { ReviewResult } from '../entities/review-result.entity';
import { CreateDeckDto, UpdateDeckDto, CreateFlashcardDto, UpdateFlashcardDto } from 'shared';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class DecksService {
  constructor(
    @InjectRepository(Deck)
    private decksRepository: Repository<Deck>,
    @InjectRepository(Flashcard)
    private flashcardsRepository: Repository<Flashcard>,
    @InjectRepository(ReviewResult)
    private reviewResultsRepository: Repository<ReviewResult>,
    private uploadService: UploadService,
  ) {}

  // Legacy methods for backward compatibility (will be updated in tests)
  findAll() {
    return this.decksRepository.find();
  }

  findOne(id: string) {
    return this.decksRepository.findOne({ where: { id } });
  }

  // New user-scoped methods
  async findByUserId(userId: string): Promise<Deck[]> {
    return this.decksRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async create(createDeckDto: CreateDeckDto, userId: string): Promise<Deck> {
    const deck = this.decksRepository.create({
      ...createDeckDto,
      userId,
    });
    return this.decksRepository.save(deck);
  }

  async findOneByUser(id: string, userId: string): Promise<Deck> {
    const deck = await this.decksRepository.findOne({
      where: { id, userId },
      relations: ['flashcards']
    });
    
    if (!deck) {
      throw new NotFoundException('Deck not found');
    }
    
    return deck;
  }

  async update(id: string, updateDeckDto: UpdateDeckDto, userId: string): Promise<Deck> {
    const deck = await this.findOneByUser(id, userId);
    Object.assign(deck, updateDeckDto);
    return this.decksRepository.save(deck);
  }

  async remove(id: string, userId: string): Promise<void> {
    const deck = await this.findOneByUser(id, userId);
    await this.decksRepository.remove(deck);
  }

  async getFlashcards(deckId: string, userId?: string): Promise<Flashcard[]> {
    // Verify user owns the deck if userId is provided
    if (userId) {
      await this.findOneByUser(deckId, userId);
    }
    
    return this.flashcardsRepository.find({ 
      where: { deckId },
      order: { createdAt: 'ASC' }
    });
  }

  async createFlashcard(deckId: string, createFlashcardDto: CreateFlashcardDto, userId: string): Promise<Flashcard> {
    // Verify user owns the deck
    await this.findOneByUser(deckId, userId);
    
    // If fileId is provided, construct the secure URL
    let imageUrl = createFlashcardDto.imageUrl;
    if (createFlashcardDto.fileId) {
      imageUrl = `/uploads/flashcards/${createFlashcardDto.fileId}`;
    }
    
    const flashcard = this.flashcardsRepository.create({
      birdName: createFlashcardDto.birdName,
      imageUrl,
      deckId,
    });
    return this.flashcardsRepository.save(flashcard);
  }

  /**
   * Extract fileId from an imageUrl that follows the pattern /uploads/flashcards/{fileId}
   */
  private extractFileIdFromUrl(imageUrl: string): string | null {
    if (!imageUrl) return null;
    
    const match = imageUrl.match(/\/uploads\/flashcards\/([^\/]+)$/);
    return match ? match[1] : null;
  }

  async updateFlashcard(deckId: string, flashcardId: string, updateFlashcardDto: UpdateFlashcardDto & { fileId?: string }, userId: string): Promise<Flashcard> {
    // Verify user owns the deck
    await this.findOneByUser(deckId, userId);
    
    const flashcard = await this.flashcardsRepository.findOne({
      where: { id: flashcardId, deckId }
    });
    
    if (!flashcard) {
      throw new NotFoundException('Flashcard not found');
    }
    
    // Store old image URL for potential cleanup
    const oldImageUrl = flashcard.imageUrl;
    
    // If fileId is provided, construct the secure URL
    let imageUrl = updateFlashcardDto.imageUrl;
    if (updateFlashcardDto.fileId) {
      imageUrl = `/uploads/flashcards/${updateFlashcardDto.fileId}`;
    }
    
    // Update flashcard properties
    if (updateFlashcardDto.birdName !== undefined) {
      flashcard.birdName = updateFlashcardDto.birdName;
    }
    if (imageUrl !== undefined) {
      flashcard.imageUrl = imageUrl;
    }
    
    const updatedFlashcard = await this.flashcardsRepository.save(flashcard);
    
    // Clean up old image file if it was replaced
    if (updateFlashcardDto.fileId && oldImageUrl && oldImageUrl !== imageUrl) {
      const oldFileId = this.extractFileIdFromUrl(oldImageUrl);
      if (oldFileId) {
        try {
          // Use a background cleanup - don't fail the update if cleanup fails
          setImmediate(async () => {
            try {
              await this.uploadService.deleteFile(oldFileId, userId);
            } catch (error) {
              console.error(`Failed to cleanup old image file ${oldFileId}:`, error);
            }
          });
        } catch (error) {
          // Log but don't throw - the update was successful
          console.error('Failed to schedule old image cleanup:', error);
        }
      }
    }
    
    return updatedFlashcard;
  }

  async removeFlashcard(deckId: string, flashcardId: string, userId: string): Promise<void> {
    // Verify user owns the deck
    await this.findOneByUser(deckId, userId);
    
    const flashcard = await this.flashcardsRepository.findOne({
      where: { id: flashcardId, deckId }
    });
    
    if (!flashcard) {
      throw new NotFoundException('Flashcard not found');
    }
    
    // Store image URL for cleanup
    const imageUrl = flashcard.imageUrl;
    
    // First, delete related review results to avoid foreign key constraint violation
    await this.reviewResultsRepository.delete({ flashcardId });
    
    // Remove flashcard from database
    await this.flashcardsRepository.remove(flashcard);
    
    // Clean up associated image file
    if (imageUrl) {
      const fileId = this.extractFileIdFromUrl(imageUrl);
      if (fileId) {
        try {
          // Use a background cleanup - don't fail the deletion if cleanup fails
          setImmediate(async () => {
            try {
              await this.uploadService.deleteFile(fileId, userId);
            } catch (error) {
              console.error(`Failed to cleanup image file ${fileId} for deleted flashcard:`, error);
            }
          });
        } catch (error) {
          // Log but don't throw - the deletion was successful
          console.error('Failed to schedule image cleanup for deleted flashcard:', error);
        }
      }
    }
  }
}