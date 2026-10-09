import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { hashPassword, verifyPassword } from './password.util';

function isDuplicateKeyError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'number' &&
    error.code === 11000
  );
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const username = registerDto.username.trim().toLowerCase();
    if (await this.usersService.findByUsername(username)) {
      throw new ConflictException('Username is already taken');
    }

    const passwordHash = await hashPassword(registerDto.password);
    try {
      const user = await this.usersService.create(username, passwordHash);
      return { id: user._id.toString(), username: user.username };
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('Username is already taken');
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const username = loginDto.username.trim().toLowerCase();
    const user = await this.usersService.findByUsername(username, true);
    if (
      !user ||
      !(await verifyPassword(loginDto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid username or password');
    }

    return {
      access_token: await this.jwtService.signAsync({
        username: user.username,
        sub: user._id.toString(),
      }),
      token_type: 'Bearer',
    };
  }
}
