import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { AuthUser, LoginResponse } from 'shared';

interface CreateUserData {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async findOrCreateUser(userData: CreateUserData): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { googleId: userData.googleId },
    });

    if (!user) {
      user = this.userRepository.create(userData);
      await this.userRepository.save(user);
    } else {
      // Update user data in case it changed
      user.email = userData.email;
      user.name = userData.name;
      user.picture = userData.picture;
      await this.userRepository.save(user);
    }

    return user;
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
    });
  }

  async login(user: User): Promise<LoginResponse> {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: authUser,
    };
  }
}
