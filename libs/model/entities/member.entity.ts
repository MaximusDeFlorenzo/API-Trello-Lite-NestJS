import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';

@Entity('members')
export class Member {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'is_admin', default: false })
    is_admin: boolean;

    @Column({ name: 'is_active', default: true })
    is_active: boolean;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdBy' })
    createdBy: User;

    @CreateDateColumn({ name: 'createdAt' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt', nullable: true })
    updatedAt: Date;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'updatedBy' })
    updatedBy: User;

    @DeleteDateColumn({ name: 'deletedAt', nullable: true })
    deletedAt: Date;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'deletedBy' })
    deletedBy: User;

    // Relations
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user' })
    user: User;

    @ManyToOne(() => Project, project => project.members)
    @JoinColumn({ name: 'project' })
    project: Project;
}
