import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'libs/model/entities/user.entity';
import { CreateStatusInput } from './dto/create-status.input';
import { UpdateStatusInput } from './dto/update-status.input';
import { ListStatusInput } from './dto/list-status.input';
import { ListStatusResponse } from './dto/list-status.dto';
import { ToggleResponses } from 'src/common/decorators/toggle.response';
import { Project, Status } from 'libs/model/entities';

@Injectable()
export class StatusService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Status)
    private statusRepository: Repository<Status>,
  ) { }

  async create(createStatusDto: CreateStatusInput, projectId: string, currentUser: User): Promise<Status> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const status = new Status();
    status.name = createStatusDto.name;
    status.project = project;
    status.createdBy = currentUser;
    status.sequence = createStatusDto.sequence;

    return this.statusRepository.save(status);
  }

  async findAll(query: ListStatusInput, currentUser: User, projectId: string): Promise<ListStatusResponse> {
    const { page = 1, limit = 10, sort_by = 'createdAt', sort_direction = 'desc', search, is_active } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const qb = this.statusRepository
      .createQueryBuilder('status')
      .leftJoinAndSelect('status.project', 'project')
      .leftJoinAndSelect('status.createdBy', 'createdBy')
      .leftJoinAndSelect('project.updatedBy', 'updatedBy')
      .where('createdBy.id = :createdById', { createdById: currentUser.id })
      .andWhere('project.id = :projectId', { projectId })
      .orWhere('is_general = true')
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

  async findOne(id: string): Promise<Status> {
    const status = await this.statusRepository.findOne({ where: { id }, relations: ['createdBy', 'updatedBy', 'deletedBy', 'project'] });

    if (!status) throw new NotFoundException(`Status with ID ${id} not found`);
    if (status.id !== id) throw new ForbiddenException('You are not allowed to access this resource');

    return status;
  }

  async update(
    id: string,
    updateStatusDto: UpdateStatusInput,
    user: User,
  ): Promise<Status | null> {
    const status = await this.findOne(id);
    if (!status) throw new NotFoundException(`Status with ID ${id} not found`);

    const updatedStatus = {
      ...status,
      updatedBy: user,
      name: updateStatusDto.name,
      sequence: updateStatusDto.sequence,
      id,
    };

    await this.statusRepository.save(updatedStatus);
    const updated = await this.statusRepository.findOne({
      where: { id },
      relations: ['createdBy', 'updatedBy', 'deletedBy', 'project']
    });

    if (!updated) throw new NotFoundException(`Status with ID ${id} not found after update`);
    return updated;
  }

  async toggleActive(id: string, user: User): Promise<ToggleResponses> {
    const status = await this.findOne(id);

    if (status.id !== id) throw new ForbiddenException('You are not allowed to access this resource');
    status.is_active = !status.is_active;
    status.updatedBy.id = user.id;

    this.statusRepository.save({ ...status, id });

    return {
      message: 'Status ' + (status.is_active ? 'enabled' : 'disabled'),
      actionBy: user,
      action: status.is_active ? 'enabled' : 'disabled',
    };
  }
}