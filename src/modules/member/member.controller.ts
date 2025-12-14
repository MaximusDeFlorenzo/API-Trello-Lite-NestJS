import {
    Controller,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Patch,
    Get,
    Query,
    Param,
    Post,
} from '@nestjs/common';
import { User } from 'libs/model/entities/user.entity';
import { CurrentUser } from '../auth/current-user.context';
import { MemberService } from './member.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListMemberInput } from './dto/list-member.input';
import { UpdateMemberInput } from './dto/update-member.input';
import { CreateMemberInput } from './dto/create-member.input';
import { ProjectAdminGuard } from '../project/guards/project-admin.guard';

@Controller('member')
@UseGuards(JwtAuthGuard, ProjectAdminGuard)
export class MemberController {
    constructor(private readonly memberService: MemberService) { }

    @Post('create')
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() createMemberInput: CreateMemberInput,
        @Query('project') project: string
    ) {
        return this.memberService.create(createMemberInput, project);
    }

    @Get('list')
    @HttpCode(HttpStatus.OK)
    async list(
        @CurrentUser() currentUser: User,
        @Body() listMemberInput: ListMemberInput,
        @Query('project') project: string
    ) {
        return this.memberService.findAll(listMemberInput, currentUser, project);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findOne(
        @Param('id') id: string
    ) {
        return this.memberService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(ProjectAdminGuard)
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id') id: string,
        @Body() updateMemberDto: UpdateMemberInput,
        @CurrentUser() currentUser: User
    ) {
        return this.memberService.update(id, updateMemberDto, currentUser);
    }

    @Patch(':id/toggle-admin')
    @UseGuards(ProjectAdminGuard)
    @HttpCode(HttpStatus.OK)
    async toggleAdmin(
        @Param('id') id: string,
        @CurrentUser() currentUser: User
    ) {
        return this.memberService.toggleAdmin(id, currentUser);
    }

    @Patch(':id/toggle-active')
    @UseGuards(ProjectAdminGuard)
    @HttpCode(HttpStatus.OK)
    async toggleActive(
        @Param('id') id: string,
        @CurrentUser() currentUser: User
    ) {
        return this.memberService.toggleActive(id, currentUser);
    }
}