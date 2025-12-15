import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from 'libs/model/entities/task.entity';
import { User } from 'libs/model/entities/user.entity';
import { CreateTasksInput } from './dto/create-tasks.input';
import { UpdateTasksInput } from './dto/update-tasks.input';
import { ListTasksInput } from './dto/list-tasks.input';
import { ListTasksResponse } from './dto/list-tasks.dto';
import { ToggleResponses } from 'src/common/decorators/toggle.response';
import { Project, Status } from 'libs/model/entities';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Status)
    private statusRepository: Repository<Status>,
  ) { }

  async create(createTaskDto: CreateTasksInput, projectId: string, currentUser: User): Promise<Task> {
    const assignee = await this.userRepository.findOne({ where: { id: createTaskDto.assignee } });
    if (!assignee) throw new NotFoundException('Assignee not found');

    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const status = await this.statusRepository.findOne({ where: { id: projectId } });
    if (!status) throw new NotFoundException('Status not found');

    const task = new Task();
    task.title = createTaskDto.title;
    task.description = createTaskDto.description || '';
    task.code = createTaskDto.code || '';
    task.project = project;
    task.status = status;
    task.createdBy = currentUser;
    task.assignee = assignee;

    return this.taskRepository.save(task);
  }

  async findAll(query: ListTasksInput, currentUser: User, projectId: string): Promise<ListTasksResponse> {
    const { page = 1, limit = 10, sort_by = 'createdAt', sort_direction = 'desc', search, is_active } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const qb = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.project', 'project')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.status', 'status')
      .leftJoinAndSelect('project.createdBy', 'createdBy')
      .leftJoinAndSelect('project.updatedBy', 'updatedBy')
      .where('assignee.id = :assigneeId', { assigneeId: currentUser.id })
      .orWhere('createdBy.id = :createdById', { createdById: currentUser.id })
      .andWhere('project.id = :projectId', { projectId })
      .skip(skip)
      .take(take)
      .orderBy(`project.${sort_by}`, sort_direction.toUpperCase() as 'ASC' | 'DESC');

    if (search) qb.where('(project.name LIKE :search OR project.description LIKE :search)', { search: `%${search}%` });
    if (is_active !== undefined) qb.andWhere('project.is_active = :is_active', { is_active: is_active });

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page: +page,
      limit: +limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id }, relations: ['createdBy', 'updatedBy', 'deletedBy', 'assignee', 'project', 'status'] });

    if (!task) throw new NotFoundException(`Task with ID ${id} not found`);
    if (task.id !== id) throw new ForbiddenException('You are not allowed to access this resource');

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTasksInput,
    user: User,
  ): Promise<Task | null> {
    const task = await this.findOne(id);
    if (!task) throw new NotFoundException(`Task with ID ${id} not found`);

    const updatedTask = {
      ...task,
      updatedBy: user,
      title: updateTaskDto.title,
      description: updateTaskDto.description,
      code: updateTaskDto.code,
      status: { id: updateTaskDto.status },
      assignee: { id: updateTaskDto.assignee },
      project: { id: updateTaskDto.project },
      id,
    };

    await this.taskRepository.save(updatedTask);
    const updated = await this.taskRepository.findOne({
      where: { id },
      relations: ['createdBy', 'updatedBy', 'deletedBy', 'assignee', 'project', 'status']
    });

    if (!updated) throw new NotFoundException(`Task with ID ${id} not found after update`);
    return updated;
  }

  async toggleActive(id: string, user: User): Promise<ToggleResponses> {
    const task = await this.findOne(id);

    if (task.id !== id) throw new ForbiddenException('You are not allowed to access this resource');
    task.is_active = !task.is_active;
    task.updatedBy.id = user.id;

    this.taskRepository.save({ ...task, id });

    return {
      message: 'Task ' + (task.is_active ? 'enabled' : 'disabled'),
      actionBy: user,
      action: task.is_active ? 'enabled' : 'disabled',
    };
  }
}