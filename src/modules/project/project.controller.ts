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
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id') id: string,
        @Body() updateProjectDto: UpdateProjectInput
    ) {
        return this.projectService.update(id, updateProjectDto);
    }

    @Patch(':id/toggle-active')
    @HttpCode(HttpStatus.OK)
    async toggleActive(
        @Param('id') id: string
    ) {
        return this.projectService.toggleActive(id);
    }
}