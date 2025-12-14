import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'libs/model/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { ListUserInput } from './dto/list-user.input';
import { FindOptionsWhere, ILike } from 'typeorm';
import { ListUserResponse } from './dto/list-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }

  async findAll(query: ListUserInput, user: User): Promise<ListUserResponse> {
    const { page = 1, limit = 10, sort_by = 'createdAt', sort_direction = 'desc', search, is_active } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: FindOptionsWhere<User> = {
      ...(search && {
        email: ILike(`%${search}%`),
        name: ILike(`%${search}%`),
        username: ILike(`%${search}%`),
      }),
      ...(user.id && { id: user.id }),
      ...(is_active !== undefined && { is_active }),
    };

    const order = {
      [sort_by]: sort_direction.toUpperCase() as 'ASC' | 'DESC'
    };

    const [users, total] = await this.usersRepository.findAndCount({
      where,
      skip,
      take,
      order,
    });

    return {
      data: users,
      total,
      page: +page,
      limit: +limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    if (user.id !== id) throw new ForbiddenException('You are not allowed to access this resource');

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { username } });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserInput,
  ): Promise<User> {
    const user = await this.findOne(id);

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    if (user.id !== id) throw new ForbiddenException('You are not allowed to access this resource');

    if (updateUserDto.password) {
      const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
      updateUserDto.password = hashedPassword;
    }

    const updateUser = await this.usersRepository.save({ ...user, ...updateUserDto });
    if (!updateUser) throw new BadRequestException('Update user failed');

    return updateUser;
  }

  async toggleActive(id: string): Promise<User> {
    const user = await this.findOne(id);

    if (user.id !== id) throw new ForbiddenException('You are not allowed to access this resource');
    user.isActive = !user.isActive;

    return this.usersRepository.save(user);
  }
}