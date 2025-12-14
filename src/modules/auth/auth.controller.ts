import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Req,
    UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserInput } from '../user/dto/create-user.input';
import { User } from 'libs/model/entities/user.entity';
import { CurrentUser } from '../auth/current-user.context';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginInput } from '../user/dto/login.input';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginInput) {
        return this.authService.login(loginDto);
    }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: CreateUserInput) {
        return this.authService.register(registerDto);
    }

    @Post('refresh')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async refresh(
        @CurrentUser() currentUser: { user: User }) {
        return this.authService.refreshToken(currentUser.user);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logout(@Req() request: Request) {
        const token = request.headers.authorization;
        if (!token) throw new UnauthorizedException('No token provided');
        return this.authService.logout(token);
    }
}