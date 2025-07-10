import { Controller, Get, Post, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { LoginResponse } from 'shared';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request): Promise<void> {
    // This endpoint initiates the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response): Promise<void> {
    const user = req.user as User;
    const loginResponse: LoginResponse = await this.authService.login(user);

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?token=${loginResponse.access_token}`;
    res.redirect(redirectUrl);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: Request): Promise<User> {
    return req.user as User;
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(): Promise<{ message: string }> {
    // JWT logout is handled on the client side by removing the token
    return { message: 'Logged out successfully' };
  }
}
