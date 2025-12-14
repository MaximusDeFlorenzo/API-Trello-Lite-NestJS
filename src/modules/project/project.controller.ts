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
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListProjectInput } from './dto/list-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { CreateProjectInput } from './dto/create-project.input';
import { ProjectAdminGuard } from './guards/project-admin.guard';

@Controller('project')
@UseGuards(JwtAuthGuard)
export class ProjectController {
    constructor(private readonly projectService: ProjectService) { }

    @Post('create')
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createProjectInput: CreateProjectInput) {
        return this.projectService.create(createProjectInput);
    }

    @Get('list')
    @HttpCode(HttpStatus.OK)
    async list(
        @CurrentUser() currentUser: User,
        @Query() listProjectInput: ListProjectInput
    ) {
        return this.projectService.findAll(listProjectInput, currentUser);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findOne(
        @Param('id') id: string
    ) {
        return this.projectService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(ProjectAdminGuard)
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id') id: string,
        @Body() updateProjectDto: UpdateProjectInput,
        @CurrentUser() currentUser: User
    ) {
        return this.projectService.update(id, updateProjectDto, currentUser);
    }

    @Patch(':id/toggle-active')
    @UseGuards(ProjectAdminGuard)
    @HttpCode(HttpStatus.OK)
    async toggleActive(
        @Param('id') id: string,
        @CurrentUser() currentUser: User
    ) {
        return this.projectService.toggleActive(id, currentUser);
    }
}