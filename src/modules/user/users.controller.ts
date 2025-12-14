import {
    Controller,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Req,
    Patch,
    Get,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from 'libs/model/entities/user.entity';
import { CurrentUser } from '../auth/current-user.context';
import { UserService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListUserInput } from './dto/list-user.input';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get('list')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async list(
        @CurrentUser() currentUser: { user: User }, @Body() listUserInput: ListUserInput) {
        return this.userService.findAll(listUserInput);
    }

    // @Get('register')
    // @HttpCode(HttpStatus.CREATED)
    // async register(@Body() registerDto: CreateUserInput) {
    //     return this.userService.register(registerDto);
    // }

    // @Patch('refresh')
    // @UseGuards(JwtAuthGuard)
    // @HttpCode(HttpStatus.OK)
    // async refresh(
    //     @CurrentUser() currentUser: { user: User }) {
    //     return this.userService.refreshToken(currentUser.user);
    // }

    // @Patch('logout')
    // @UseGuards(JwtAuthGuard)
    // @HttpCode(HttpStatus.OK)
    // async logout(@Req() request: Request) {
    //     const token = request.headers.authorization;
    //     if (!token) throw new UnauthorizedException('No token provided');
    //     return this.userService.logout(token);
    // }
}