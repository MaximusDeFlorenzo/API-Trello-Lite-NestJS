import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './users.service';
import { User } from 'libs/model/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  // controllers: [UserController],
  providers: [
    UserService,
  ],
  exports: [UserService],
})
export class UsersModule { }