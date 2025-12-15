import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusController } from './status.controller';
import { StatusService } from './status.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../user/users.module';
import { Member, Project, Status, Task, User } from 'libs/model/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    TypeOrmModule.forFeature([Member]),
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Task]),
    TypeOrmModule.forFeature([Status]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [StatusController],
  providers: [StatusService],
  exports: [StatusService],
})
export class StatusModule { }