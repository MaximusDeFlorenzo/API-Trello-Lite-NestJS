import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from 'src/config/config.service';
import * as bcrypt from 'bcrypt';
import { LoginInput } from '../user/dto/login.input';
import { CreateUserInput } from '../user/dto/create-user.input';
import { UserService } from '../user/users.service';
import { User } from 'libs/model/entities/user.entity';
import { TokenDto } from './dto/token.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async login(loginDto: LoginInput) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const laravelHash = user.password.replace(/^\$2y\$/, '$2b$');
    const isMatch = await bcrypt.compare(loginDto.password, laravelHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return this.getTokens(user);
  }

  async register(registerDto: CreateUserInput) {
    if (registerDto.password !== registerDto.password_confirmation)
      throw new BadRequestException('Password and password_confirmation do not match');

    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) throw new ConflictException('Email already in use');

    const existingUsername = await this.usersService.findByUsername(
      registerDto.username,
    );
    if (existingUsername) throw new ConflictException('Username already taken');

    const user = await this.usersService.create(registerDto);
    return user;
  }

  async refreshToken(user: User) {
    return this.getTokens(user);
  }

  async verify(token: string): Promise<TokenDto> {
    const tokenWithoutBearer = token.replace("Bearer ", "");
    const userResult: TokenDto = await this.jwtService.verifyAsync(
      tokenWithoutBearer,
      {
        secret: this.configService.JWT_SECRET,
      },
    );
    return userResult;
  }

  async logout(user: User) {
    // In a real app, you might want to add the token to a blacklist
    return { message: 'Successfully logged out' };
  }

  private async getTokens(user: User) {
    const [accessToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: user.id,
          email: user.email,
          username: user.username,
        },
        {
          secret: this.configService.JWT_SECRET,
          expiresIn: '15m',
        },
      )
    ]);

    return {
      token: accessToken,
      token_type: 'bearer',
      expires_in: 3600,
      user,
    };
  }
}