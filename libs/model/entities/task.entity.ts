import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Status } from './status.entity';

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column({ unique: true })
    code: string;

    @Column({ name: 'is_active', default: true })
    is_active: boolean;

    @Column({ name: 'due_date', nullable: true })
    dueDate: Date;

    @CreateDateColumn({ name: 'createdAt' })
    createdAt: Date;

    @ManyToOne(() => User, { nullable: true })
    createdBy: User;

    @UpdateDateColumn({ name: 'updatedAt', nullable: true })
    updatedAt: Date;

    @ManyToOne(() => User, { nullable: true })
    updatedBy: User;

    @DeleteDateColumn({ name: 'deletedAt', nullable: true })
    deletedAt: Date;

    @ManyToOne(() => User, { nullable: true })
    deletedBy: User;

    // Relations
    @ManyToOne(() => Status, status => status.tasks, { nullable: true })
    status: Status;

    @ManyToOne(() => Project, project => project.tasks, { nullable: true })
    project: Project;

    @ManyToOne(() => User, user => user.assignedTasks, { nullable: true })
    assignee: User;
}
