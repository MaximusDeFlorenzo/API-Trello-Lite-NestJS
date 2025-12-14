import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Status } from './status.entity';
import { Task } from './task.entity';
import { Member } from './member.entity';

@Entity('projects')
export class Project {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

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
    @OneToMany(() => Status, status => status.project)
    statuses: Status[];

    @OneToMany(() => Task, task => task.project)
    tasks: Task[];

    @OneToMany(() => Member, member => member.project)
    members: Member[];
}
