import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
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

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdBy' })
    createdBy: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'updatedBy' })
    updatedBy: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'deletedBy' })
    deletedBy: User;

    @ManyToOne(() => Status, { nullable: true })
    @JoinColumn({ name: 'status' })
    status: Status;

    @ManyToOne(() => Project, { nullable: true })
    @JoinColumn({ name: 'project' })
    project: Project;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'assignee' })
    assignee: User;
}
