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
import { StatusService } from './status.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListStatusInput } from './dto/list-status.input';
import { UpdateStatusInput } from './dto/update-status.input';
import { CreateStatusInput } from './dto/create-status.input';
import { ProjectAdminGuard } from '../project/guards/project-admin.guard';

@Controller('status')
@UseGuards(JwtAuthGuard, ProjectAdminGuard)
export class StatusController {
    constructor(private readonly statusService: StatusService) { }

    @Post('create')
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() createStatusInput: CreateStatusInput,
        @CurrentUser() currentUser: User,
        @Query('project') project: string
    ) {
        return this.statusService.create(createStatusInput, project, currentUser);
    }

    @Get('list/:id')
    @HttpCode(HttpStatus.OK)
    async list(
        @CurrentUser() currentUser: User,
        @Body() listStatusInput: ListStatusInput,
        @Param('id') project: string
    ) {
        return this.statusService.findAll(listStatusInput, currentUser, project);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findOne(
        @Param('id') id: string
    ) {
        return this.statusService.findOne(id);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id') id: string,
        @Body() updateStatusDto: UpdateStatusInput,
        @CurrentUser() currentUser: User
    ) {
        return this.statusService.update(id, updateStatusDto, currentUser);
    }

    @Patch(':id/toggle-active')
    @HttpCode(HttpStatus.OK)
    async toggleActive(
        @Param('id') id: string,
        @CurrentUser() currentUser: User
    ) {
        return this.statusService.toggleActive(id, currentUser);
    }
}