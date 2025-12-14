import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Project } from 'libs/model/entities/project.entity';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { ListProjectInput } from './dto/list-project.input';
import { ListProjectResponse } from './dto/list-project.dto';
import { FindOptionsWhere, ILike } from 'typeorm';
import { User } from 'libs/model/entities';
import { ToggleResponses } from 'src/common/decorators/toggle.response';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) { }

  async create(createProjectDto: CreateProjectInput): Promise<Project> {
    const existingProject = await this.projectRepository.findOne({
      where: {
        name: createProjectDto.name,
      }
    });
    if (existingProject) throw new BadRequestException('This name is already used by another project');

    const project = this.projectRepository.create({ ...createProjectDto });
    const created = await this.projectRepository.save(project);
    return created;
  }

  // async findAll(query: ListProjectInput, currentUser: User): Promise<ListProjectResponse> {
  //   const { page = 1, limit = 10, sort_by = 'createdAt', sort_direction = 'desc', search, is_active } = query;
  //   const skip = (page - 1) * limit;
  //   const take = limit;

  //   const where: FindOptionsWhere<Project> = {
  //     ...(search && {
  //       name: ILike(`%${search}%`),
  //       description: ILike(`%${search}%`)
  //     }),
  //     ...(currentUser.id && { createdBy: currentUser }),
  //     ...(is_active !== undefined && { is_active }),
  //   };

  //   const order = {
  //     [sort_by]: sort_direction.toUpperCase() as 'ASC' | 'DESC'
  //   };

  //   const [data, total] = await this.projectRepository.findAndCount({
  //     where,
  //     skip,
  //     relations: ['createdBy', 'updatedBy', 'deletedBy'],
  //     take,
  //     order,
  //   });

  //   return {
  //     data,
  //     total,
  //     page: +page,
  //     limit: +limit,
  //     totalPages: Math.ceil(total / limit),
  //   };
  // }

  async findAll(query: ListProjectInput, currentUser: User): Promise<ListProjectResponse> {
    const { page = 1, limit = 10, sort_by = 'createdAt', sort_direction = 'desc', search, is_active } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const qb = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.members', 'member')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('project.createdBy', 'createdBy')
      .leftJoinAndSelect('project.updatedBy', 'updatedBy')
      .where('user.id = :userId', { userId: currentUser.id })
      .orWhere('project.createdBy = :userId', { userId: currentUser.id })
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

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id }, relations: ['createdBy', 'updatedBy', 'deletedBy', 'members.user'] });

    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);
    if (project.id !== id) throw new ForbiddenException('You are not allowed to access this resource');

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectInput,
    user: User,
  ): Promise<Project | null> {
    const project = await this.findOne(id);
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);

    if (updateProjectDto.name && updateProjectDto.name !== project.name) {
      const existingProject = await this.projectRepository.findOne({
        where: {
          name: updateProjectDto.name,
          id: Not(id)
        }
      });
      if (existingProject) throw new BadRequestException('This name is already used by another project');
    }

    await this.projectRepository.save({
      ...project,
      updatedBy: user,
      ...updateProjectDto,
      id,
    });

    const updated = await this.projectRepository.findOne({
      where: { id },
      relations: ['createdBy', 'updatedBy', 'deletedBy']
    });

    if (!updated) throw new NotFoundException(`Project with ID ${id} not found after update`);

    return updated;
  }

  async toggleActive(id: string, user: User): Promise<ToggleResponses> {
    const project = await this.findOne(id);

    if (project.id !== id) throw new ForbiddenException('You are not allowed to access this resource');
    project.is_active = !project.is_active;
    project.updatedBy = user;

    this.projectRepository.save({ ...project, id });

    return {
      message: 'Project ' + (project.is_active ? 'enabled' : 'disabled'),
      actionBy: user,
      action: project.is_active ? 'enabled' : 'disabled',
    };
  }
}