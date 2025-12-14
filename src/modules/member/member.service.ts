import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Member } from 'libs/model/entities/member.entity';
import { User } from 'libs/model/entities/user.entity';
import { CreateMemberInput } from './dto/create-member.input';
import { UpdateMemberInput } from './dto/update-member.input';
import { ListMemberInput } from './dto/list-member.input';
import { ListMemberResponse } from './dto/list-member.dto';
import { FindOptionsWhere, ILike } from 'typeorm';
import { ToggleResponses } from 'src/common/decorators/toggle.response';
import { Project } from 'libs/model/entities';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) { }

  async create(createMemberDto: CreateMemberInput, projectId: string): Promise<Member> {
    const user = await this.userRepository.findOne({ where: { id: createMemberDto.user } });
    if (!user) throw new NotFoundException('User not found');

    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const existingMember = await this.memberRepository.findOne({ where: { user: { id: createMemberDto.user }, project: { id: projectId } } });
    if (existingMember) throw new BadRequestException('This user is already a member of this project');

    const member = this.memberRepository.create({
      user: { id: user.id },
      project: { id: projectId },
      is_admin: createMemberDto.is_admin || false,
      createdBy: user,
    });

    const savedMember = await this.memberRepository.save(member);
    return savedMember;
  }

  async findAll(query: ListMemberInput, currentUser: User, projectId: string): Promise<ListMemberResponse> {
    const { page = 1, limit = 10, sort_by = 'createdAt', sort_direction = 'desc', search, is_active } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const qb = this.memberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.project', 'project')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('project.createdBy', 'createdBy')
      .leftJoinAndSelect('project.updatedBy', 'updatedBy')
      .where('user.id = :userId', { userId: currentUser.id })
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

  async findOne(id: string): Promise<Member> {
    const member = await this.memberRepository.findOne({ where: { id }, relations: ['createdBy', 'updatedBy', 'deletedBy', 'user', 'project'] });

    if (!member) throw new NotFoundException(`Member with ID ${id} not found`);
    if (member.id !== id) throw new ForbiddenException('You are not allowed to access this resource');

    return member;
  }

  async update(
    id: string,
    updateMemberDto: UpdateMemberInput,
    user: User,
  ): Promise<Member | null> {
    const member = await this.findOne(id);
    if (!member) throw new NotFoundException(`Member with ID ${id} not found`);

    const updatedMember = {
      ...member,
      user: { id: updateMemberDto.user },
      is_admin: updateMemberDto.is_admin,
      updatedBy: user,
      id,
    };

    await this.memberRepository.save(updatedMember);
    const updated = await this.memberRepository.findOne({
      where: { id },
      relations: ['createdBy', 'updatedBy', 'deletedBy', 'user', 'project']
    });

    if (!updated) throw new NotFoundException(`Member with ID ${id} not found after update`);
    return updated;
  }

  async toggleActive(id: string, user: User): Promise<ToggleResponses> {
    const member = await this.findOne(id);

    if (member.id !== id) throw new ForbiddenException('You are not allowed to access this resource');
    member.is_active = !member.is_active;
    member.updatedBy.id = user.id;

    this.memberRepository.save({ ...member, id });

    return {
      message: 'Member ' + (member.is_active ? 'enabled' : 'disabled'),
      actionBy: user,
      action: member.is_active ? 'enabled' : 'disabled',
    };
  }

  async toggleAdmin(id: string, user: User): Promise<ToggleResponses> {
    const member = await this.findOne(id);

    if (member.id !== id) throw new ForbiddenException('You are not allowed to access this resource');
    member.is_admin = !member.is_admin;
    member.updatedBy.id = user.id;

    this.memberRepository.save({ ...member, id });

    return {
      message: 'Member ' + (member.is_admin ? 'enabled' : 'disabled'),
      actionBy: user,
      action: member.is_admin ? 'enabled' : 'disabled',
    };
  }
}