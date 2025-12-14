import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from 'libs/model/entities/project.entity';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { ListProjectInput } from './dto/list-project.input';
import { ListProjectResponse } from './dto/list-project.dto';
import { FindOptionsWhere, ILike } from 'typeorm';
import { User } from 'libs/model/entities';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) { }

  async create(createProjectDto: CreateProjectInput): Promise<Project> {
    const project = this.projectRepository.create({ ...createProjectDto });
    return this.projectRepository.save(project);
  }

  async findAll(query: ListProjectInput, currentUser: User): Promise<ListProjectResponse> {
    const { page = 1, limit = 10, sort_by = 'createdAt', sort_direction = 'desc', search, is_active } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: FindOptionsWhere<Project> = {
      ...(search && {
        name: ILike(`%${search}%`),
        description: ILike(`%${search}%`)
      }),
      ...(currentUser.id && { createdBy: currentUser }),
      ...(is_active !== undefined && { is_active }),
    };

    console.log(where);

    const order = {
      [sort_by]: sort_direction.toUpperCase() as 'ASC' | 'DESC'
    };

    const [data, total] = await this.projectRepository.findAndCount({
      where,
      skip,
      relations: ['createdBy', 'updatedBy', 'deletedBy'],
      take,
      order,
    });

    return {
      data,
      total,
      page: +page,
      limit: +limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id }, relations: ['createdBy', 'updatedBy', 'deletedBy'] });

    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);
    if (project.id !== id) throw new ForbiddenException('You are not allowed to access this resource');

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectInput,
  ): Promise<Project> {
    const project = await this.findOne(id);

    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);
    if (project.id !== id) throw new ForbiddenException('You are not allowed to access this resource');

    return this.projectRepository.save({ ...updateProjectDto });
  }

  async toggleActive(id: string): Promise<Project> {
    const project = await this.findOne(id);

    if (project.id !== id) throw new ForbiddenException('You are not allowed to access this resource');
    project.isActive = !project.isActive;

    return this.projectRepository.save(project);
  }
}