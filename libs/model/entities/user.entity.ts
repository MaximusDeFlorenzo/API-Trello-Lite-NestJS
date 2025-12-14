import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index, OneToMany } from 'typeorm';
import { Project } from './project.entity';
import { Task } from './task.entity';
import { Member } from './member.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 50 })
  username: string;

  @Column({ length: 100 })
  name: string;

  @Column()
  password: string;

  @Column({ name: 'is_active', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', nullable: true })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deletedAt', nullable: true })
  deletedAt: Date;

  // Relations
  @OneToMany(() => Project, project => project.createdBy)
  createdProjects: Project[];

  @OneToMany(() => Project, project => project.updatedBy)
  updatedProjects: Project[];

  @OneToMany(() => Project, project => project.deletedBy)
  deletedProjects: Project[];

  @OneToMany(() => Task, task => task.assignee)
  assignedTasks: Task[];

  @OneToMany(() => Task, task => task.createdBy)
  createdTasks: Task[];

  @OneToMany(() => Task, task => task.updatedBy)
  updatedTasks: Task[];

  @OneToMany(() => Task, task => task.deletedBy)
  deletedTasks: Task[];

  @OneToMany(() => Member, member => member.user)
  memberships: Member[];

  toJSON() {
    const { password, ...rest } = this;
    return rest;
  }
}
