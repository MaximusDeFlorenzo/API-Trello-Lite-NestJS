import { CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';

@Entity('members')
export class Member {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'createdAt' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', nullable: true })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deletedAt', nullable: true })
    deletedAt: Date;

    // Relations
    @ManyToOne(() => User, user => user.memberships)
    @JoinColumn({ name: 'user' })
    user: User;

    @ManyToOne(() => Project, project => project.members)
    @JoinColumn({ name: 'project' })
    project: Project;
}
