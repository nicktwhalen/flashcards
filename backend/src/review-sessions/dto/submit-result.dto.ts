import { IsString, IsUUID, IsEnum } from 'class-validator';
import { DifficultyRating } from '../../entities';

export class SubmitResultDto {
  @IsString()
  @IsUUID()
  flashcardId: string;

  @IsEnum(DifficultyRating)
  difficultyRating: DifficultyRating;
}
