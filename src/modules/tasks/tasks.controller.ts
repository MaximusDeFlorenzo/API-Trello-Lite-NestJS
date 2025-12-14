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
import { TaskService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListTasksInput } from './dto/list-tasks.input';
import { UpdateTasksInput } from './dto/update-tasks.input';
import { CreateTasksInput } from './dto/create-tasks.input';
import { ProjectAdminGuard } from '../project/guards/project-admin.guard';

@Controller('task')
@UseGuards(JwtAuthGuard, ProjectAdminGuard)
export class TaskController {
    constructor(private readonly taskService: TaskService) { }

    @Post('create')
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() createTaskInput: CreateTasksInput,
        @CurrentUser() currentUser: User,
        @Query('project') project: string
    ) {
        return this.taskService.create(createTaskInput, project, currentUser);
    }

    @Get('list')
    @HttpCode(HttpStatus.OK)
    async list(
        @CurrentUser() currentUser: User,
        @Body() listTasksInput: ListTasksInput,
        @Query('project') project: string
    ) {
        return this.taskService.findAll(listTasksInput, currentUser, project);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findOne(
        @Param('id') id: string
    ) {
        return this.taskService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(ProjectAdminGuard)
    @HttpCode(HttpStatus.OK)
    async update(
        @Param('id') id: string,
        @Body() updateTaskDto: UpdateTasksInput,
        @CurrentUser() currentUser: User
    ) {
        return this.taskService.update(id, updateTaskDto, currentUser);
    }

    @Patch(':id/toggle-active')
    @UseGuards(ProjectAdminGuard)
    @HttpCode(HttpStatus.OK)
    async toggleActive(
        @Param('id') id: string,
        @CurrentUser() currentUser: User
    ) {
        return this.taskService.toggleActive(id, currentUser);
    }
}