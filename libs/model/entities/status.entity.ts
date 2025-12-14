import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Task } from './task.entity';

@Entity('statuses')
export class Status {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ default: 0 })
    sequence: number;

    @Column({ name: 'is_active', default: true })
    is_active: boolean;

    @Column({ name: 'is_general', default: false })
    isGeneral: boolean;

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
    @ManyToOne(() => Project, project => project.statuses, { nullable: true })
    project: Project;

    @OneToMany(() => Task, task => task.status)
    tasks: Task[];
}
