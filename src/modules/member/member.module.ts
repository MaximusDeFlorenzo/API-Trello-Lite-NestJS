import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../user/users.module';
import { Member, Project, Task, User } from 'libs/model/entities';
import { ProjectAdminGuard } from '../project/guards/project-admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    TypeOrmModule.forFeature([Member]),
    TypeOrmModule.forFeature([Task]),
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [MemberController],
  providers: [MemberService, ProjectAdminGuard],
  exports: [MemberService],
})
export class MemberModule { }