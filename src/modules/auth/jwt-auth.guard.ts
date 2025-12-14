import {
  CustomDecorator,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { TokenDto } from './dto/token.dto';
import { UserService } from '../user/users.service';
import { TokenBlacklistService } from './token-blacklist.service';

const IS_PUBLIC_KEY = "isPublic";
export const Public = (): CustomDecorator => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
    private readonly usersService: UserService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = request.headers?.authorization;

    if (!token) {
      throw new HttpException(
        "Authorization token is required",
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const cleanToken = token.replace(/^Bearer\s+/i, '');

      const isBlacklisted = await this.tokenBlacklistService.isTokenBlacklisted(cleanToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      const tokenData: TokenDto = await this.authService.verify(cleanToken);

      if (!tokenData) {
        throw new HttpException(
          "Token has been invalidated due to global logout",
          HttpStatus.UNAUTHORIZED,
        );
      }

      const user = await this.usersService.findOne(tokenData.id);
      if (!user) throw new HttpException("User not found", HttpStatus.NOT_FOUND);

      request.user = user;
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      throw new HttpException(message, HttpStatus.UNAUTHORIZED);
    }
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }
}
