import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'libs/model/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

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

  async findAll(query: any) {
    const { page = 1, limit = 10, ...filters } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const [users, total] = await this.usersRepository.findAndCount({
      where: filters,
      skip,
      take,
    });

    return {
      data: users,
      meta: {
        total,
        page: +page,
        limit: +limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

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
    currentUser: any,
  ): Promise<User> {
    if (currentUser.id !== id && !currentUser.isAdmin) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async toggleActive(id: string, currentUser: any): Promise<User> {
    if (!currentUser.isAdmin) {
      throw new ForbiddenException('Only admins can toggle user status');
    }

    const user = await this.findOne(id);
    user.isActive = !user.isActive;
    return this.usersRepository.save(user);
  }
}