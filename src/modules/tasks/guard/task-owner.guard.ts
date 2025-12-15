import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, User } from 'libs/model/entities';

type RequestWithUser = Request & { user: User };

@Injectable()
export class TaskOwnerGuard implements CanActivate {
    constructor(
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<RequestWithUser>();
        const userId = request.user?.id || request.body?.project;

        let taskId = request.params?.id;
        let projectId = request.query?.project;
        const task = this.taskRepository
            .createQueryBuilder('task')
            .leftJoinAndSelect('task.project', 'project')
            .leftJoinAndSelect('task.assignee', 'assignee')
            .leftJoinAndSelect('task.status', 'status')
            .leftJoinAndSelect('project.createdBy', 'createdBy')
            .where('id = :taskId', { taskId })
            .where('assignee.id = :assigneeId', { assigneeId: userId })
            .orWhere('createdBy.id = :createdById', { createdById: userId })
            .andWhere('project.id = :projectId', { projectId })
            .getOne();

        if (!task) throw new ForbiddenException('Unauthorized - not a task owner');

        request['task'] = task;
        return true;
    }
}
