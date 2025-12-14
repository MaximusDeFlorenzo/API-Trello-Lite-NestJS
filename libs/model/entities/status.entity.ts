import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';
import { Project } from './project.entity';

@Entity('statuses')
export class Status {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ default: 0 })
    sequence: number;

    @Column({ default: true })
    is_active: boolean;

    @Column({ default: false })
    is_general: boolean;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdBy' })
    createdBy: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'updatedBy' })
    updatedBy: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'deletedBy' })
    deletedBy: User;

    @ManyToOne(() => Project, { nullable: true })
    @JoinColumn({ name: 'project' })
    project: Project;

    @OneToMany(() => Task, task => task.status)
    tasks: Task[];
}