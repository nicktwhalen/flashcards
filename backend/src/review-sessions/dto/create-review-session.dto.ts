import { IsString, IsUUID } from 'class-validator';

export class CreateReviewSessionDto {
  @IsString()
  @IsUUID()
  deckId: string;
}