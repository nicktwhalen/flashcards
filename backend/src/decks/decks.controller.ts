import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { DecksService } from './decks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateDeckDto, UpdateDeckDto, CreateFlashcardDto, UpdateFlashcardDto } from 'shared';
import { User } from '../entities/user.entity';

@Controller('decks')
@UseGuards(JwtAuthGuard)
export class DecksController {
  constructor(private readonly decksService: DecksService) {}

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as User;
    return this.decksService.findByUserId(user.id);
  }

  @Post()
  create(@Body() createDeckDto: CreateDeckDto, @Req() req: Request) {
    const user = req.user as User;
    return this.decksService.create(createDeckDto, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.decksService.findOneByUser(id, user.id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDeckDto: UpdateDeckDto, @Req() req: Request) {
    const user = req.user as User;
    return this.decksService.update(id, updateDeckDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.decksService.remove(id, user.id);
  }

  @Get(':id/flashcards')
  getFlashcards(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as User;
    return this.decksService.getFlashcards(id, user.id);
  }

  @Post(':id/flashcards')
  createFlashcard(@Param('id') id: string, @Body() createFlashcardDto: CreateFlashcardDto, @Req() req: Request) {
    const user = req.user as User;
    return this.decksService.createFlashcard(id, createFlashcardDto, user.id);
  }

  @Put(':deckId/flashcards/:flashcardId')
  updateFlashcard(@Param('deckId') deckId: string, @Param('flashcardId') flashcardId: string, @Body() updateFlashcardDto: UpdateFlashcardDto, @Req() req: Request) {
    const user = req.user as User;
    return this.decksService.updateFlashcard(deckId, flashcardId, updateFlashcardDto, user.id);
  }

  @Delete(':deckId/flashcards/:flashcardId')
  removeFlashcard(@Param('deckId') deckId: string, @Param('flashcardId') flashcardId: string, @Req() req: Request) {
    const user = req.user as User;
    return this.decksService.removeFlashcard(deckId, flashcardId, user.id);
  }
}
