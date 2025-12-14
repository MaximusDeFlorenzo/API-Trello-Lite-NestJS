import {
    Controller,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Req,
    Patch,
    Get,
    Query,
    Param,
} from '@nestjs/common';
import { User } from 'libs/model/entities/user.entity';
import { CurrentUser } from '../auth/current-user.context';
import { UserService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListUserInput } from './dto/list-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get('list')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async list(
        @CurrentUser() currentUser: User,
        @Query() listUserInput: ListUserInput
    ) {
        return this.userService.findAll(listUserInput, currentUser);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async findOne(
        @Param('id') id: string
    ) {
        return this.userService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserInput
    ) {
        return this.userService.update(id, updateUserDto);
    }

    @Patch(':id/toggle-active')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async toggleActive(
        @Param('id') id: string
    ) {
        return this.userService.toggleActive(id);
    }
}