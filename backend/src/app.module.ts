import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, Deck, Flashcard, ReviewSession, ReviewResult } from './entities';
import { AuthModule } from './auth/auth.module';
import { DecksModule } from './decks/decks.module';
import { ReviewSessionsModule } from './review-sessions/review-sessions.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [User, Deck, Flashcard, ReviewSession, ReviewResult],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    DecksModule,
    ReviewSessionsModule,
    UploadModule,
  ],
})
export class AppModule {}
