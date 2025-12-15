import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member, User } from 'libs/model/entities';

type RequestWithUser = Request & { user: User };

@Injectable()
export class ProjectAdminGuard implements CanActivate {
    constructor(
        @InjectRepository(Member)
        private memberRepository: Repository<Member>
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<RequestWithUser>();
        const userId = request.user?.id;

        let projectId = request.body?.project || request.query?.project;
        if (!projectId) projectId = request.params?.id;

        let member = await this.memberRepository.findOne({
            where: { id: projectId },
            relations: ['project'],
        });

        if (!member) {
            member = await this.memberRepository.findOne({
                where: { project: { id: projectId } },
                relations: ['project', 'user'],
            });
        }

        if (!member || !member.project) throw new NotFoundException('Project not found');

        const userMembership = await this.memberRepository.findOne({
            where: {
                project: { id: member.project.id },
                user: { id: userId },
                is_admin: true,
            },
        });

        if (!userMembership) throw new ForbiddenException('Unauthorized - not a project admin');

        request['project'] = member.project;
        return true;
    }
}
